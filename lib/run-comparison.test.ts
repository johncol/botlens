import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — hoisted by vitest before imports
// ---------------------------------------------------------------------------
vi.mock("./fetch-human", () => ({
  fetchHumanHtml: vi.fn(),
}));
vi.mock("./fetch-crawler", () => ({
  fetchCrawlerHtml: vi.fn(),
}));
vi.mock("./html-to-markdown", () => ({
  htmlToMarkdown: vi.fn((html: string) => `md:${html}`),
}));
vi.mock("./compare-markdowns", () => ({
  compareMarkdowns: vi.fn(() => ({
    hunks: [],
    addedLines: 0,
    removedLines: 0,
    isIdentical: true,
  })),
}));

import { runComparison } from "./run-comparison";
import { fetchHumanHtml } from "./fetch-human";
import { fetchCrawlerHtml } from "./fetch-crawler";
import { htmlToMarkdown } from "./html-to-markdown";

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------
describe("runComparison", () => {
  beforeEach(() => {
    vi.mocked(fetchHumanHtml).mockResolvedValue({ html: "<p>Human</p>" });
    vi.mocked(fetchCrawlerHtml).mockResolvedValue("<p>Crawler</p>");
    vi.mocked(htmlToMarkdown).mockImplementation((html: string) => `md:${html}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns both markdowns and resolvedUrl on success", async () => {
    const result = await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
    });

    expect(result.humanMarkdown).toBe("md:<p>Human</p>");
    expect(result.crawlerMarkdown).toBe("md:<p>Crawler</p>");
    expect(result.resolvedUrl).toBe("https://example.com");
    expect(result.humanError).toBeUndefined();
    expect(result.crawlerError).toBeUndefined();
  });

  it("includes a comparison result when both fetches succeed", async () => {
    const result = await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
    });

    expect(result.comparison).not.toBeNull();
    expect(result.comparison?.isIdentical).toBe(true);
  });

  it("returns humanError and null humanMarkdown when human fetch fails", async () => {
    vi.mocked(fetchHumanHtml).mockRejectedValue(new Error("Browser crashed"));

    const result = await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
    });

    expect(result.humanMarkdown).toBeNull();
    expect(result.humanError).toBe("Browser crashed");
    expect(result.comparison).toBeNull();
  });

  it("returns crawlerError and null crawlerMarkdown when crawler fetch fails", async () => {
    vi.mocked(fetchCrawlerHtml).mockRejectedValue(new Error("403 Forbidden"));

    const result = await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
    });

    expect(result.crawlerMarkdown).toBeNull();
    expect(result.crawlerError).toBe("403 Forbidden");
    expect(result.comparison).toBeNull();
  });

  it("sets crawlerWarning when crawler markdown is empty/whitespace", async () => {
    vi.mocked(htmlToMarkdown)
      .mockReturnValueOnce("md:human") // human call
      .mockReturnValueOnce("   "); // crawler call — whitespace only

    const result = await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
    });

    expect(result.crawlerWarning).toMatch(/requires JavaScript/);
  });

  it("forwards humanWarning from the human fetch result", async () => {
    vi.mocked(fetchHumanHtml).mockResolvedValue({
      html: "<p>Human</p>",
      warning: "Network did not reach idle state",
    });

    const result = await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
    });

    expect(result.humanWarning).toBe("Network did not reach idle state");
  });

  it("passes credentials to both fetchers", async () => {
    const credentials = { username: "u", password: "p" };

    await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
      credentials,
    });

    expect(vi.mocked(fetchHumanHtml)).toHaveBeenCalledWith(
      "https://example.com",
      credentials,
      expect.any(Object),
    );
    expect(vi.mocked(fetchCrawlerHtml)).toHaveBeenCalledWith(
      "https://example.com",
      "Bot/1.0",
      credentials,
      expect.any(Object),
    );
  });

  it("passes tunable options to the human fetcher", async () => {
    await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
      scrollMax: 3,
      pageTimeoutMs: 20_000,
    });

    expect(vi.mocked(fetchHumanHtml)).toHaveBeenCalledWith(
      "https://example.com",
      null,
      { scrollMax: 3, pageTimeoutMs: 20_000 },
    );
  });

  it("passes maxHtmlBytes to the crawler fetcher", async () => {
    await runComparison({
      url: "https://example.com",
      crawlerUserAgent: "Bot/1.0",
      maxHtmlBytes: 512 * 1024,
    });

    expect(vi.mocked(fetchCrawlerHtml)).toHaveBeenCalledWith(
      "https://example.com",
      "Bot/1.0",
      null,
      { maxHtmlBytes: 512 * 1024 },
    );
  });
});
