import { fetchHumanHtml, type Credentials } from "./fetch-human";
import { fetchCrawlerHtml } from "./fetch-crawler";
import { htmlToMarkdown } from "./html-to-markdown";
import { compareMarkdowns, type ComparisonResult } from "./compare-markdowns";
import { settledError, settledValue } from "./errors";
import { DEFAULT_TAG_FILTER, emptyContentWarning } from "./tag-filters";

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

  const humanHtml = settledValue(humanResult);
  const crawlerHtml = settledValue(crawlerResult);

  const humanMarkdown = humanHtml === null ? null : htmlToMarkdown(humanHtml.html);
  const crawlerMarkdown = crawlerHtml === null ? null : htmlToMarkdown(crawlerHtml);

  const humanWarning = humanHtml?.warning;
  const crawlerWarning =
    crawlerMarkdown !== null && !crawlerMarkdown.trim()
      ? emptyContentWarning(DEFAULT_TAG_FILTER)
      : undefined;

  const humanError = settledError(humanResult);
  const crawlerError = settledError(crawlerResult);

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
