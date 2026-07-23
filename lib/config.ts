import "server-only";

function parseEnvInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    console.warn(
      `[config] ${key} env var has invalid value "${raw}"; using default ${defaultValue}`,
    );
    return defaultValue;
  }
  return parsed;
}

// ── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_SCROLL_MAX = 10;
export const DEFAULT_PAGE_TIMEOUT_MS = 60_000;

// ── Env-derived config ────────────────────────────────────────────────────────
export const MAX_HTML_BYTES = parseEnvInt("MAX_HTML_BYTES", DEFAULT_MAX_HTML_BYTES);
export const SCROLL_MAX = parseEnvInt("SCROLL_MAX", DEFAULT_SCROLL_MAX);
export const PAGE_TIMEOUT_MS = parseEnvInt("PAGE_TIMEOUT_MS", DEFAULT_PAGE_TIMEOUT_MS);

export const GATE_PASSWORD: string | undefined = process.env.GATE_PASSWORD;
export const PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: string | undefined = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export const IS_VERCEL: boolean = Boolean(process.env.VERCEL);
export const IS_LOCAL: boolean = !IS_VERCEL;
