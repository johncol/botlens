import { NextRequest, NextResponse } from "next/server";
import { ENVIRONMENTS, type Environment } from "@/lib/environments";
import { assertNotPrivateUrl } from "@/lib/ssrf-guard";
import { AI_CRAWLERS } from "@/lib/crawlers";
import { runComparison } from "@/lib/run-comparison";
import { SCROLL_MAX, PAGE_TIMEOUT_MS, MAX_HTML_BYTES, IS_VERCEL } from "@/lib/config";

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

  if (ENVIRONMENTS[env].kind === "localhost" && IS_VERCEL) {
    return NextResponse.json(
      { error: `The ${ENVIRONMENTS[env].label} environment is only available when BotLens runs on your machine` },
      { status: 400 },
    );
  }

  const credentials =
    ENVIRONMENTS[env].requiresAuth && username && password
      ? { username, password }
      : null;

  if (ENVIRONMENTS[env].requiresAuth && !credentials) {
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
    if (IS_VERCEL) {
      await assertNotPrivateUrl(rawUrl);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid URL" },
      { status: 400 },
    );
  }

  const result = await runComparison({
    url: rawUrl,
    crawlerUserAgent,
    credentials,
    scrollMax: SCROLL_MAX,
    pageTimeoutMs: PAGE_TIMEOUT_MS,
    maxHtmlBytes: MAX_HTML_BYTES,
  });

  return NextResponse.json(result);
}
