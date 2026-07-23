import { NextRequest, NextResponse } from "next/server";
import TurndownService from "turndown";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { assertNotPrivateUrl } from "@/lib/ssrf-guard";
import { stripStyleTags } from "@/lib/html-to-markdown";

const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export async function POST(request: NextRequest) {
  let body: { url?: string; html?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, html: rawHtml } = body;
  let html: string;

  if (url) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only http:// and https:// URLs are supported" },
        { status: 400 },
      );
    }

    try {
      await assertNotPrivateUrl(url);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid URL" },
        { status: 400 },
      );
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": "botlens/1.0" },
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown fetch error";
      return NextResponse.json(
        { error: `Failed to fetch URL: ${message}` },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Remote server returned ${response.status} ${response.statusText}`,
        },
        { status: 502 },
      );
    }

    html = await response.text();
  } else if (rawHtml && typeof rawHtml === "string") {
    if (Buffer.byteLength(rawHtml, "utf8") > MAX_HTML_BYTES) {
      return NextResponse.json(
        { error: "HTML payload too large (max 2 MB)" },
        { status: 413 },
      );
    }
    html = rawHtml;
  } else {
    return NextResponse.json(
      { error: 'Provide either "url" or "html" in the request body' },
      { status: 400 },
    );
  }

  const tdResult = turndown.turndown(html);
  const nhmResult = NodeHtmlMarkdown.translate(stripStyleTags(html));

  return NextResponse.json({ turndown: tdResult, nodeHtmlMarkdown: nhmResult });
}
