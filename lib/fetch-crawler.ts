import * as cheerio from "cheerio";
import type { Credentials } from "./fetch-human";

export type FetchCrawlerOptions = {
  maxHtmlBytes?: number;
};

const DEFAULT_MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB

function extractMain(html: string): string {
  const $ = cheerio.load(html);
  const main = $("main");
  if (!main.length) return "";
  return main.html() ?? "";
}

export async function fetchCrawlerHtml(
  url: string,
  userAgent: string,
  credentials: Credentials | null,
  options: FetchCrawlerOptions = {},
): Promise<string> {
  const maxHtmlBytes = options.maxHtmlBytes ?? DEFAULT_MAX_HTML_BYTES;
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

  if (!res.ok) {
    throw new Error(`Remote server returned ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > maxHtmlBytes) {
    throw new Error("Remote page too large (max 2 MB)");
  }
  const html = new TextDecoder().decode(buffer);
  const mainHtml = extractMain(html);
  if (!mainHtml) {
    throw new Error("No <main> element found on this page.");
  }
  return mainHtml;
}
