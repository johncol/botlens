import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";
import * as cheerio from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";
import type { TranslatorConfigFactory } from "node-html-markdown";
import { ENVIRONMENTS, type Environment } from "@/lib/environments";
import { assertNotPrivateUrl } from "@/lib/ssrf-guard";
import { AI_CRAWLERS } from "@/lib/crawlers";

export const maxDuration = 60;

/**
 * Custom NHM instance that preserves <video> elements as markdown links.
 * node-html-markdown has no built-in video handler, so videos are silently
 * dropped without this translator.
 */
const nhm = new NodeHtmlMarkdown(
  {},
  {
    video: ((ctx) => {
      const node = ctx.node as import("node-html-parser").HTMLElement;
      // Try the src attribute on the <video> itself first
      let src = node.getAttribute("src") ?? "";
      // Fall back to the first <source> child
      if (!src) {
        src = node.querySelector("source")?.getAttribute("src") ?? "";
      }
      if (!src) return { ignore: true };
      const label = node.getAttribute("title") || "Video";
      return {
        content: `[${label}](${src})`,
        surroundingNewlines: 1,
        preserveIfEmpty: false,
      };
    }) as TranslatorConfigFactory,
    // Suppress bare <source> tags — they're already handled inside <video>
    source: { ignore: true },
  },
);

const SCROLL_MAX = 10;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB
const PAGE_TIMEOUT = 60_000;

function extractMain(html: string): string {
  const $ = cheerio.load(html);
  const main = $("main");
  if (!main.length) return "";
  return main.html() ?? "";
}

async function fetchHumanHtml(
  url: string,
  creds: { username: string; password: string } | null,
): Promise<{ html: string; warning?: string }> {
  let executablePath: string | undefined;
  if (process.env.VERCEL) {
    const sparticuz = await import("@sparticuz/chromium");
    executablePath = await sparticuz.default.executablePath();
  } else {
    executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  try {
    const context = await browser.newContext();
    if (creds) {
      await context.setHTTPCredentials({
        username: creds.username,
        password: creds.password,
      });
    }

    const page = await context.newPage();
    // Navigate and wait for the load event (reliable); then attempt networkidle as best-effort.
    await page.goto(url, { waitUntil: "load", timeout: PAGE_TIMEOUT });

    let warning: string | undefined;
    try {
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
    } catch {
      warning =
        "Network did not reach idle state within 15 s — page may still be loading dynamic content. Human HTML may be incomplete.";
    }

    // Scroll until bottom, capped at SCROLL_MAX
    for (let i = 0; i < SCROLL_MAX; i++) {
      const atBottom = await page.evaluate(() => {
        const prev = window.scrollY;
        window.scrollBy(0, window.innerHeight);
        return (
          window.scrollY === prev ||
          window.scrollY + window.innerHeight >= document.body.scrollHeight
        );
      });
      // Brief pause for lazy-load observers to fire
      await page.waitForTimeout(400);
      if (atBottom) break;
    }

    // Wait a moment for any triggered content to load
    await page.waitForTimeout(800);

    const mainHtml = await page.evaluate(() => {
      const el = document.querySelector("main");
      return el ? el.innerHTML : null;
    });

    if (mainHtml === null) {
      throw new Error("No <main> element found on this page.");
    }

    return { html: mainHtml, warning };
  } finally {
    await browser.close();
  }
}

async function fetchCrawlerHtml(
  url: string,
  userAgent: string,
  creds: { username: string; password: string } | null,
): Promise<string> {
  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  if (creds) {
    headers["Authorization"] =
      `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString("base64")}`;
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Remote server returned ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_HTML_BYTES) {
    throw new Error("Remote page too large (max 2 MB)");
  }
  const html = new TextDecoder().decode(buffer);
  const mainHtml = extractMain(html);
  if (!mainHtml) {
    throw new Error("No <main> element found on this page.");
  }
  return mainHtml;
}

export async function POST(request: NextRequest) {
  let body: {
    url?: string;
    environment?: string;
    crawlerUserAgent?: string;
    username?: string;
    password?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    url: rawUrl,
    environment,
    crawlerUserAgent,
    username,
    password,
  } = body;

  if (!rawUrl || !environment || !crawlerUserAgent) {
    return NextResponse.json(
      { error: "url, environment, and crawlerUserAgent are required" },
      { status: 400 },
    );
  }

  const knownAgents = new Set(AI_CRAWLERS.map((c) => c.userAgent));
  if (!knownAgents.has(crawlerUserAgent)) {
    return NextResponse.json(
      { error: "Unknown crawler user agent" },
      { status: 400 },
    );
  }

  if (!Object.keys(ENVIRONMENTS).includes(environment)) {
    return NextResponse.json(
      { error: `Unknown environment: ${environment}` },
      { status: 400 },
    );
  }

  const env = environment as Environment;

  const creds =
    ENVIRONMENTS[env].requiresAuth && username && password
      ? { username, password }
      : null;

  if (ENVIRONMENTS[env].requiresAuth && !creds) {
    return NextResponse.json(
      { error: "Credentials required for this environment" },
      { status: 400 },
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { error: "Only http:// and https:// URLs are supported" },
      { status: 400 },
    );
  }
  void parsedUrl; // used above for protocol check only; assertNotPrivateUrl re-parses internally

  try {
    await assertNotPrivateUrl(rawUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid URL" },
      { status: 400 },
    );
  }

  const [humanResult, crawlerResult] = await Promise.allSettled([
    fetchHumanHtml(rawUrl, creds),
    fetchCrawlerHtml(rawUrl, crawlerUserAgent, creds),
  ]);

  if (humanResult.status === "rejected") {
    return NextResponse.json(
      {
        error: `Human Experience: ${humanResult.reason?.message ?? "Unknown error"}`,
      },
      { status: 502 },
    );
  }
  if (crawlerResult.status === "rejected") {
    return NextResponse.json(
      {
        error: `AI Crawler Experience: ${crawlerResult.reason?.message ?? "Unknown error"}`,
      },
      { status: 502 },
    );
  }

  const humanMarkdown = nhm.translate(humanResult.value.html);
  const crawlerMarkdown = nhm.translate(crawlerResult.value);

  const crawlerWarning = crawlerMarkdown.trim()
    ? undefined
    : "Crawler received a page with no readable text in <main> — the site likely requires JavaScript to render content. Raw bots see an empty shell.";

  return NextResponse.json({
    humanMarkdown,
    crawlerMarkdown,
    resolvedUrl: rawUrl,
    humanWarning: humanResult.value.warning,
    crawlerWarning,
  });
}
