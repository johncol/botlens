import { NextRequest, NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  credentialsFor,
  validateCredentials,
  validateCrawlerUserAgent,
  validateEnvironmentName,
  validateEnvironmentReachable,
  validateFetchableUrl,
} from "@/lib/api-validation";
import { type Environment } from "@/lib/environments";
import { runComparison } from "@/lib/run-comparison";
import { SCROLL_MAX, PAGE_TIMEOUT_MS, MAX_HTML_BYTES } from "@/lib/config";

type HumanVsBotRequest = {
  url?: string;
  environment?: string;
  crawlerUserAgent?: string;
  username?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const { body, errorResponse } = await readJsonBody<HumanVsBotRequest>(request);
  if (errorResponse) {
    return errorResponse;
  }

  const { url, environment, crawlerUserAgent, username, password } = body;

  if (!url || !environment || !crawlerUserAgent) {
    return jsonError("url, environment, and crawlerUserAgent are required");
  }

  const invalidRequest =
    validateCrawlerUserAgent(crawlerUserAgent) ??
    validateEnvironmentName(environment);
  if (invalidRequest) {
    return jsonError(invalidRequest);
  }

  const env = environment as Environment;
  const credentials = credentialsFor(env, { username: username ?? "", password: password ?? "" });

  const invalidEnvironment =
    validateEnvironmentReachable(env) ?? validateCredentials(env, credentials);
  if (invalidEnvironment) {
    return jsonError(invalidEnvironment);
  }

  const invalidUrl = await validateFetchableUrl(url);
  if (invalidUrl) {
    return jsonError(invalidUrl);
  }

  const result = await runComparison({
    url,
    crawlerUserAgent,
    credentials,
    scrollMax: SCROLL_MAX,
    pageTimeoutMs: PAGE_TIMEOUT_MS,
    maxHtmlBytes: MAX_HTML_BYTES,
  });

  return NextResponse.json(result);
}
