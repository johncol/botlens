import { fetchHumanHtml, type Credentials } from "./fetch-human";
import { fetchCrawlerHtml } from "./fetch-crawler";
import { htmlToMarkdown } from "./html-to-markdown";
import { compareMarkdowns, type ComparisonResult } from "./compare-markdowns";

export type { Credentials, ComparisonResult };
export type { DiffHunk } from "./compare-markdowns";

export type RunComparisonOptions = {
  url: string;
  crawlerUserAgent: string;
  credentials?: Credentials | null;
  /** Max scroll iterations for the human browser fetch */
  scrollMax: number;
  /** Navigation timeout in ms for the human browser fetch */
  pageTimeoutMs: number;
  /** Max response size in bytes for the crawler fetch */
  maxHtmlBytes: number;
};

export type RunComparisonResult = {
  humanMarkdown: string | null;
  crawlerMarkdown: string | null;
  comparison: ComparisonResult | null;
  humanWarning?: string;
  crawlerWarning?: string;
  humanError?: string;
  crawlerError?: string;
  resolvedUrl: string;
};

export async function runComparison(
  options: RunComparisonOptions,
): Promise<RunComparisonResult> {
  const {
    url,
    crawlerUserAgent,
    credentials = null,
    scrollMax,
    pageTimeoutMs,
    maxHtmlBytes,
  } = options;

  const [humanResult, crawlerResult] = await Promise.allSettled([
    fetchHumanHtml(url, credentials, { scrollMax, pageTimeoutMs }),
    fetchCrawlerHtml(url, crawlerUserAgent, credentials, { maxHtmlBytes }),
  ]);

  if (humanResult.status === "rejected") {
    console.error("Human experience fetch failed", humanResult.reason);
  }
  if (crawlerResult.status === "rejected") {
    console.error("AI crawler experience fetch failed", crawlerResult.reason);
  }

  const humanMarkdown =
    humanResult.status === "fulfilled"
      ? htmlToMarkdown(humanResult.value.html)
      : null;
  const crawlerMarkdown =
    crawlerResult.status === "fulfilled"
      ? htmlToMarkdown(crawlerResult.value)
      : null;

  const humanWarning =
    humanResult.status === "fulfilled" ? humanResult.value.warning : undefined;
  const crawlerWarning =
    crawlerMarkdown !== null && !crawlerMarkdown.trim()
      ? "Crawler received a page with no readable text in <main> — the site likely requires JavaScript to render content. Raw bots see an empty shell."
      : undefined;

  const humanError =
    humanResult.status === "rejected"
      ? humanResult.reason instanceof Error
        ? humanResult.reason.message
        : "Unknown error"
      : undefined;
  const crawlerError =
    crawlerResult.status === "rejected"
      ? crawlerResult.reason instanceof Error
        ? crawlerResult.reason.message
        : "Unknown error"
      : undefined;

  const comparison =
    humanMarkdown !== null && crawlerMarkdown !== null
      ? compareMarkdowns(humanMarkdown, crawlerMarkdown)
      : null;

  return {
    humanMarkdown,
    crawlerMarkdown,
    comparison,
    humanWarning,
    crawlerWarning,
    humanError,
    crawlerError,
    resolvedUrl: url,
  };
}
