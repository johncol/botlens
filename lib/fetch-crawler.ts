import * as cheerio from "cheerio";
import type { Credentials } from "./fetch-human";
import { DEFAULT_MAX_HTML_BYTES } from "@/lib/config";
import { DEFAULT_TAG_FILTER } from "@/lib/tag-filters";
import { CrawlerHttpError } from "@/lib/errors";

export type FetchCrawlerOptions = {
  maxHtmlBytes?: number;
  /** CSS tag name to extract before converting to markdown. Defaults to `"main"`. */
  tagFilter?: string;
};

export type FetchCrawlerResult = {
  html: string;
  statusLabel: string;
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
): Promise<FetchCrawlerResult> {
  const maxHtmlBytes = options.maxHtmlBytes ?? DEFAULT_MAX_HTML_BYTES;
  const tagFilter = options.tagFilter ?? DEFAULT_TAG_FILTER;
  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  if (credentials) {
    headers["Authorization"] =
      `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`;
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  const statusLabel = res.redirected
    ? `redirected ➔ ${res.status} ${res.statusText}`
    : `${res.status} ${res.statusText}`;

  if (!res.ok) {
    throw new CrawlerHttpError(
      `Remote server returned ${res.status} ${res.statusText}`,
      statusLabel,
    );
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > maxHtmlBytes) {
    throw new CrawlerHttpError(`Remote page too large (max ${maxHtmlBytes} bytes)`, statusLabel);
  }
  const html = new TextDecoder().decode(buffer);
  const tagHtml = extractTag(html, tagFilter);
  if (!tagHtml) {
    throw new CrawlerHttpError(
      `No <${tagFilter}> element found on this page.`,
      statusLabel,
    );
  }
  return { html: tagHtml, statusLabel };
}
