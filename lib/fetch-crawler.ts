import * as cheerio from "cheerio";
import type { Credentials } from "./fetch-human";
import { DEFAULT_MAX_HTML_BYTES } from "@/lib/config";
import { DEFAULT_TAG_FILTER } from "@/lib/tag-filters";

export type FetchCrawlerOptions = {
  maxHtmlBytes?: number;
  /** CSS tag name to extract before converting to markdown. Defaults to `"main"`. */
  tagFilter?: string;
};

function extractTag(html: string, tag: string): string {
  const $ = cheerio.load(html);
  const el = $(tag);
  if (!el.length) return "";
  return el.html() ?? "";
}

export async function fetchCrawlerHtml(
  url: string,
  userAgent: string,
  credentials: Credentials | null,
  options: FetchCrawlerOptions = {},
): Promise<string> {
  const maxHtmlBytes = options.maxHtmlBytes ?? DEFAULT_MAX_HTML_BYTES;
  const tagFilter = options.tagFilter ?? DEFAULT_TAG_FILTER;
  const isLocal = new URL(url).hostname === "localhost";
  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ...(isLocal ? { "x-is-bot": "true" } : {}),
  };

  if (credentials) {
    headers["Authorization"] =
      `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`;
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Remote server returned ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > maxHtmlBytes) {
    throw new Error("Remote page too large (max 2 MB)");
  }
  const html = new TextDecoder().decode(buffer);
  const tagHtml = extractTag(html, tagFilter);
  if (!tagHtml) {
    throw new Error(`No <${tagFilter}> element found on this page.`);
  }
  return tagHtml;
}
