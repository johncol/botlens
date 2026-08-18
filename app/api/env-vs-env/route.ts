import { NextRequest, NextResponse } from "next/server";
import {
  ENVIRONMENTS,
  buildUrl,
  isValidPort,
  MAX_PORT,
  MIN_PORT,
  type Environment,
} from "@/lib/environments";
import { assertNotPrivateUrl } from "@/lib/ssrf-guard";
import { AI_CRAWLERS } from "@/lib/crawlers";
import { fetchCrawlerHtml } from "@/lib/fetch-crawler";
import { htmlToMarkdown } from "@/lib/html-to-markdown";
import { IS_VERCEL, MAX_HTML_BYTES } from "@/lib/config";

const ALLOWED_TAG_FILTERS = ["body", "header", "nav", "main", "footer"] as const;
type TagFilter = (typeof ALLOWED_TAG_FILTERS)[number];

export async function POST(request: NextRequest) {
  let body: {
    domain?: string;
    page?: string;
    leftEnvironment?: string;
    rightEnvironment?: string;
    crawlerUserAgent?: string;
    tagFilter?: string;
    localPort?: string;
    credentials?: Partial<Record<Environment, { username: string; password: string }>>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    domain,
    page,
    leftEnvironment,
    rightEnvironment,
    crawlerUserAgent,
    tagFilter = "main",
    localPort = "",
    credentials = {},
  } = body;

  if (!domain || !page || !leftEnvironment || !rightEnvironment || !crawlerUserAgent) {
    return NextResponse.json(
      { error: "domain, page, leftEnvironment, rightEnvironment, and crawlerUserAgent are required" },
      { status: 400 },
    );
  }

  if (!(ALLOWED_TAG_FILTERS as readonly string[]).includes(tagFilter)) {
    return NextResponse.json(
      { error: `tagFilter must be one of: ${ALLOWED_TAG_FILTERS.join(", ")}` },
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

  if (!Object.keys(ENVIRONMENTS).includes(leftEnvironment)) {
    return NextResponse.json(
      { error: `Unknown environment: ${leftEnvironment}` },
      { status: 400 },
    );
  }
  if (!Object.keys(ENVIRONMENTS).includes(rightEnvironment)) {
    return NextResponse.json(
      { error: `Unknown environment: ${rightEnvironment}` },
      { status: 400 },
    );
  }

  const leftEnv = leftEnvironment as Environment;
  const rightEnv = rightEnvironment as Environment;

  const usesLocal = [leftEnv, rightEnv].some(
    (env) => ENVIRONMENTS[env].kind === "localhost",
  );

  if (usesLocal && IS_VERCEL) {
    return NextResponse.json(
      { error: `The ${ENVIRONMENTS.local.label} environment is only available when BotLens runs on your machine` },
      { status: 400 },
    );
  }

  if (usesLocal && !isValidPort(localPort)) {
    return NextResponse.json(
      { error: `localPort must be a whole number between ${MIN_PORT} and ${MAX_PORT}` },
      { status: 400 },
    );
  }

  const leftCreds = ENVIRONMENTS[leftEnv].requiresAuth
    ? (credentials[leftEnv] ?? null)
    : null;
  const rightCreds = ENVIRONMENTS[rightEnv].requiresAuth
    ? (credentials[rightEnv] ?? null)
    : null;

  if (ENVIRONMENTS[leftEnv].requiresAuth && !leftCreds) {
    return NextResponse.json(
      { error: `Credentials required for ${ENVIRONMENTS[leftEnv].label} environment` },
      { status: 400 },
    );
  }
  if (ENVIRONMENTS[rightEnv].requiresAuth && !rightCreds) {
    return NextResponse.json(
      { error: `Credentials required for ${ENVIRONMENTS[rightEnv].label} environment` },
      { status: 400 },
    );
  }

  const leftUrl = buildUrl(domain, page, leftEnv, { localPort });
  const rightUrl = buildUrl(domain, page, rightEnv, { localPort });

  for (const url of [leftUrl, rightUrl]) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "Only http:// and https:// URLs are supported" },
        { status: 400 },
      );
    }
    try {
      if (IS_VERCEL) {
        await assertNotPrivateUrl(url);
      }
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid URL" },
        { status: 400 },
      );
    }
  }

  const [leftResult, rightResult] = await Promise.allSettled([
    fetchCrawlerHtml(leftUrl, crawlerUserAgent, leftCreds, {
      maxHtmlBytes: MAX_HTML_BYTES,
      tagFilter: tagFilter as TagFilter,
    }),
    fetchCrawlerHtml(rightUrl, crawlerUserAgent, rightCreds, {
      maxHtmlBytes: MAX_HTML_BYTES,
      tagFilter: tagFilter as TagFilter,
    }),
  ]);

  const leftMarkdown =
    leftResult.status === "fulfilled" ? htmlToMarkdown(leftResult.value) : null;
  const rightMarkdown =
    rightResult.status === "fulfilled" ? htmlToMarkdown(rightResult.value) : null;

  const leftWarning =
    leftMarkdown !== null && !leftMarkdown.trim()
      ? `Crawler received a page with no readable text in <${tagFilter}> — the site likely requires JavaScript to render content.`
      : undefined;
  const rightWarning =
    rightMarkdown !== null && !rightMarkdown.trim()
      ? `Crawler received a page with no readable text in <${tagFilter}> — the site likely requires JavaScript to render content.`
      : undefined;

  const leftError =
    leftResult.status === "rejected"
      ? leftResult.reason instanceof Error
        ? leftResult.reason.message
        : "Unknown error"
      : undefined;
  const rightError =
    rightResult.status === "rejected"
      ? rightResult.reason instanceof Error
        ? rightResult.reason.message
        : "Unknown error"
      : undefined;

  return NextResponse.json({
    leftMarkdown,
    rightMarkdown,
    leftWarning,
    rightWarning,
    leftError,
    rightError,
  });
}
