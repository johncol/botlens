import "server-only";
import { NextResponse } from "next/server";
import { AI_CRAWLERS } from "@/lib/crawlers";
import { IS_VERCEL } from "@/lib/config";
import { ENVIRONMENTS, type Environment } from "@/lib/environments";
import { assertNotPrivateUrl } from "@/lib/ssrf-guard";
import { toErrorMessage } from "@/lib/errors";
import { TAG_FILTERS, isTagFilter, type TagFilter } from "@/lib/tag-filters";
import type { Credentials } from "@/lib/fetch-human";

/** Validators return an error message when the value is rejected, or null when it is accepted. */
export type ValidationMessage = string | null;

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Parses the request body as JSON. Returns the parsed body, or a ready-to-send
 * 400 response when the payload is not valid JSON.
 */
export async function readJsonBody<T>(
  request: Request,
): Promise<{ body: T; errorResponse: null } | { body: null; errorResponse: NextResponse }> {
  try {
    return { body: (await request.json()) as T, errorResponse: null };
  } catch {
    return { body: null, errorResponse: jsonError("Invalid JSON body") };
  }
}

/**
 * Rejects URLs that are malformed, use an unsupported scheme, or (on Vercel)
 * resolve to a private address. Guards every outbound fetch against SSRF.
 */
export async function validateFetchableUrl(url: string): Promise<ValidationMessage> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Invalid URL format";
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return "Only http:// and https:// URLs are supported";
  }

  if (!IS_VERCEL) {
    return null;
  }

  try {
    await assertNotPrivateUrl(url);
    return null;
  } catch (error) {
    return toErrorMessage(error, "Invalid URL");
  }
}

const KNOWN_USER_AGENTS = new Set(AI_CRAWLERS.map((crawler) => crawler.userAgent));

export function validateCrawlerUserAgent(userAgent: string): ValidationMessage {
  return KNOWN_USER_AGENTS.has(userAgent) ? null : "Unknown crawler user agent";
}

export function isEnvironment(value: string): value is Environment {
  return Object.keys(ENVIRONMENTS).includes(value);
}

export function validateEnvironmentName(value: string): ValidationMessage {
  return isEnvironment(value) ? null : `Unknown environment: ${value}`;
}

/** The Local environment can only be reached when BotLens runs on the user's machine. */
export function validateEnvironmentReachable(env: Environment): ValidationMessage {
  if (ENVIRONMENTS[env].kind !== "localhost" || !IS_VERCEL) {
    return null;
  }
  return `The ${ENVIRONMENTS[env].label} environment is only available when BotLens runs on your machine`;
}

export function validateCredentials(
  env: Environment,
  credentials: Credentials | null,
): ValidationMessage {
  if (!ENVIRONMENTS[env].requiresAuth) {
    return null;
  }
  const isComplete = Boolean(credentials?.username && credentials?.password);
  return isComplete
    ? null
    : `Credentials required for ${ENVIRONMENTS[env].label} environment`;
}

/** Drops credentials for environments that are not behind a login. */
export function credentialsFor(
  env: Environment,
  provided: Credentials | null | undefined,
): Credentials | null {
  if (!ENVIRONMENTS[env].requiresAuth || !provided?.username || !provided?.password) {
    return null;
  }
  return provided;
}

export function validateTagFilter(value: string): ValidationMessage {
  return isTagFilter(value)
    ? null
    : `tagFilter must be one of: ${TAG_FILTERS.join(", ")}`;
}

export type { TagFilter };
