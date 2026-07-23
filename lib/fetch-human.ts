import { chromium } from "playwright-core";
import {
  DEFAULT_SCROLL_MAX,
  DEFAULT_PAGE_TIMEOUT_MS,
  IS_VERCEL,
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
} from "@/lib/config";

export type Credentials = { username: string; password: string };

export type FetchHumanOptions = {
  scrollMax?: number;
  pageTimeoutMs?: number;
};

export async function fetchHumanHtml(
  url: string,
  credentials: Credentials | null,
  options: FetchHumanOptions = {},
): Promise<{ html: string; warning?: string }> {
  const scrollMax = options.scrollMax ?? DEFAULT_SCROLL_MAX;
  const pageTimeout = options.pageTimeoutMs ?? DEFAULT_PAGE_TIMEOUT_MS;
  let executablePath: string | undefined;
  let args: string[] | undefined;
  if (IS_VERCEL) {
    const sparticuz = await import("@sparticuz/chromium");
    executablePath = await sparticuz.default.executablePath();
    args = sparticuz.default.args;
  } else {
    executablePath = PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }

  const browser = await chromium.launch({
    headless: true,
    ...(args ? { args } : {}),
    ...(executablePath ? { executablePath } : {}),
  });

  try {
    const context = await browser.newContext();
    if (credentials) {
      await context.setHTTPCredentials({
        username: credentials.username,
        password: credentials.password,
      });
    }

    const page = await context.newPage();
    // Navigate and wait for the load event (reliable); then attempt networkidle as best-effort.
    await page.goto(url, { waitUntil: "load", timeout: pageTimeout });

    let warning: string | undefined;
    try {
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
    } catch {
      warning =
        "Network did not reach idle state within 15 s — page may still be loading dynamic content. Human HTML may be incomplete.";
    }

    // Scroll until bottom, capped at scrollMax
    for (let i = 0; i < scrollMax; i++) {
      const atBottom = await page.evaluate(() => {
        const prev = window.scrollY;
        window.scrollBy(0, window.innerHeight);
        return (
          window.scrollY === prev ||
          window.scrollY + window.innerHeight >= document.body.scrollHeight
        );
      });
      // Brief pause for lazy-load observers to fire
      await page.waitForTimeout(400);
      if (atBottom) break;
    }

    // Wait a moment for any triggered content to load
    await page.waitForTimeout(800);

    const mainHtml = await page.evaluate(() => {
      const el = document.querySelector("main");
      return el ? el.innerHTML : null;
    });

    if (mainHtml === null) {
      throw new Error("No <main> element found on this page.");
    }

    return { html: mainHtml, warning };
  } finally {
    await browser.close();
  }
}
