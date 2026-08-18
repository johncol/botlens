import { NextRequest, NextResponse } from "next/server";
import {
  ENVIRONMENTS,
  buildUrl,
  isValidPort,
  MAX_PORT,
  MIN_PORT,
  type Environment,
} from "@/lib/environments";
import {
  jsonError,
  readJsonBody,
  credentialsFor,
  validateCredentials,
  validateCrawlerUserAgent,
  validateEnvironmentName,
  validateEnvironmentReachable,
  validateFetchableUrl,
  validateTagFilter,
} from "@/lib/api-validation";
import { fetchCrawlerHtml } from "@/lib/fetch-crawler";
import { htmlToMarkdown } from "@/lib/html-to-markdown";
import { settledError, settledValue } from "@/lib/errors";
import {
  DEFAULT_TAG_FILTER,
  emptyContentWarning,
  type TagFilter,
} from "@/lib/tag-filters";
import { MAX_HTML_BYTES } from "@/lib/config";
import type { Credentials } from "@/lib/fetch-human";

type EnvVsEnvRequest = {
  domain?: string;
  page?: string;
  leftEnvironment?: string;
  rightEnvironment?: string;
  crawlerUserAgent?: string;
  tagFilter?: string;
  localPort?: string;
  credentials?: Partial<Record<Environment, Credentials>>;
};

export async function POST(request: NextRequest) {
  const { body, errorResponse } = await readJsonBody<EnvVsEnvRequest>(request);
  if (errorResponse) {
    return errorResponse;
  }

  const {
    domain,
    page,
    leftEnvironment,
    rightEnvironment,
    crawlerUserAgent,
    tagFilter = DEFAULT_TAG_FILTER,
    localPort = "",
    credentials = {},
  } = body;

  if (!domain || !page || !leftEnvironment || !rightEnvironment || !crawlerUserAgent) {
    return jsonError(
      "domain, page, leftEnvironment, rightEnvironment, and crawlerUserAgent are required",
    );
  }

  const invalidRequest =
    validateTagFilter(tagFilter) ??
    validateCrawlerUserAgent(crawlerUserAgent) ??
    validateEnvironmentName(leftEnvironment) ??
    validateEnvironmentName(rightEnvironment);
  if (invalidRequest) {
    return jsonError(invalidRequest);
  }

  const leftEnv = leftEnvironment as Environment;
  const rightEnv = rightEnvironment as Environment;
  const leftCreds = credentialsFor(leftEnv, credentials[leftEnv]);
  const rightCreds = credentialsFor(rightEnv, credentials[rightEnv]);

  const invalidEnvironment =
    validateEnvironmentReachable(leftEnv) ??
    validateEnvironmentReachable(rightEnv) ??
    validateCredentials(leftEnv, leftCreds) ??
    validateCredentials(rightEnv, rightCreds);
  if (invalidEnvironment) {
    return jsonError(invalidEnvironment);
  }

  const usesLocal = [leftEnv, rightEnv].some(
    (env) => ENVIRONMENTS[env].kind === "localhost",
  );
  if (usesLocal && !isValidPort(localPort)) {
    return jsonError(
      `localPort must be a whole number between ${MIN_PORT} and ${MAX_PORT}`,
    );
  }

  const leftUrl = buildUrl(domain, page, leftEnv, { localPort });
  const rightUrl = buildUrl(domain, page, rightEnv, { localPort });

  for (const url of [leftUrl, rightUrl]) {
    const invalidUrl = await validateFetchableUrl(url);
    if (invalidUrl) {
      return jsonError(invalidUrl);
    }
  }

  const fetchOptions = {
    maxHtmlBytes: MAX_HTML_BYTES,
    tagFilter: tagFilter as TagFilter,
  };

  const [leftResult, rightResult] = await Promise.allSettled([
    fetchCrawlerHtml(leftUrl, crawlerUserAgent, leftCreds, fetchOptions),
    fetchCrawlerHtml(rightUrl, crawlerUserAgent, rightCreds, fetchOptions),
  ]);

  function toMarkdown(result: PromiseSettledResult<string>): string | null {
    const html = settledValue(result);
    return html === null ? null : htmlToMarkdown(html);
  }

  function toWarning(markdown: string | null): string | undefined {
    return markdown !== null && !markdown.trim()
      ? emptyContentWarning(tagFilter)
      : undefined;
  }

  const leftMarkdown = toMarkdown(leftResult);
  const rightMarkdown = toMarkdown(rightResult);

  return NextResponse.json({
    leftMarkdown,
    rightMarkdown,
    leftWarning: toWarning(leftMarkdown),
    rightWarning: toWarning(rightMarkdown),
    leftError: settledError(leftResult),
    rightError: settledError(rightResult),
  });
}
