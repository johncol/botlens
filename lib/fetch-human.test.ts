import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// playwright-core mock — use vi.hoisted so variables are available when
// vi.mock factory runs (vi.mock is hoisted to the top of the file)
// ---------------------------------------------------------------------------
const {
  mockClose,
  mockWaitForTimeout,
  mockGoto,
  mockWaitForLoadState,
  mockSetHTTPCredentials,
  mockEvaluate,
  mockNewPage,
  mockNewContext,
  mockLaunch,
} = vi.hoisted(() => {
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockWaitForTimeout = vi.fn().mockResolvedValue(undefined);
  const mockGoto = vi.fn().mockResolvedValue(undefined);
  const mockWaitForLoadState = vi.fn().mockResolvedValue(undefined);
  const mockSetHTTPCredentials = vi.fn().mockResolvedValue(undefined);
  const mockEvaluate = vi.fn();

  const mockNewPage = vi.fn().mockResolvedValue({
    goto: mockGoto,
    waitForLoadState: mockWaitForLoadState,
    waitForTimeout: mockWaitForTimeout,
    evaluate: mockEvaluate,
  });

  const mockNewContext = vi.fn().mockResolvedValue({
    setHTTPCredentials: mockSetHTTPCredentials,
    newPage: mockNewPage,
  });

  const mockLaunch = vi.fn().mockResolvedValue({
    newContext: mockNewContext,
    close: mockClose,
  });

  return {
    mockClose,
    mockWaitForTimeout,
    mockGoto,
    mockWaitForLoadState,
    mockSetHTTPCredentials,
    mockEvaluate,
    mockNewPage,
    mockNewContext,
    mockLaunch,
  };
});

vi.mock("playwright-core", () => ({
  chromium: { launch: mockLaunch },
}));

import { fetchHumanHtml } from "./fetch-human";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function setupScrollThenHtml(html: string) {
  // First evaluate call: scroll loop hits bottom immediately
  mockEvaluate.mockResolvedValueOnce(true);
  // Second evaluate call: return main innerHTML
  mockEvaluate.mockResolvedValueOnce(html);
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------
describe("fetchHumanHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClose.mockResolvedValue(undefined);
    mockWaitForTimeout.mockResolvedValue(undefined);
    mockGoto.mockResolvedValue(undefined);
    mockWaitForLoadState.mockResolvedValue(undefined);
    mockSetHTTPCredentials.mockResolvedValue(undefined);
    mockNewPage.mockResolvedValue({
      goto: mockGoto,
      waitForLoadState: mockWaitForLoadState,
      waitForTimeout: mockWaitForTimeout,
      evaluate: mockEvaluate,
    });
    mockNewContext.mockResolvedValue({
      setHTTPCredentials: mockSetHTTPCredentials,
      newPage: mockNewPage,
    });
    mockLaunch.mockResolvedValue({
      newContext: mockNewContext,
      close: mockClose,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns html from the main element", async () => {
    setupScrollThenHtml("<p>Hello</p>");

    const result = await fetchHumanHtml("https://example.com", null);

    expect(result.html).toBe("<p>Hello</p>");
    expect(result.warning).toBeUndefined();
  });

  it("throws when no <main> element is found", async () => {
    mockEvaluate.mockResolvedValueOnce(true); // scroll done
    mockEvaluate.mockResolvedValueOnce(null); // no main element

    await expect(fetchHumanHtml("https://example.com", null)).rejects.toThrow(
      "No <main> element found on this page.",
    );
  });

  it("sets HTTP credentials when provided", async () => {
    setupScrollThenHtml("<p>Protected</p>");

    await fetchHumanHtml("https://example.com", {
      username: "user",
      password: "pass",
    });

    expect(mockSetHTTPCredentials).toHaveBeenCalledWith({
      username: "user",
      password: "pass",
    });
  });

  it("does not call setHTTPCredentials when credentials are null", async () => {
    setupScrollThenHtml("<p>Public</p>");

    await fetchHumanHtml("https://example.com", null);

    expect(mockSetHTTPCredentials).not.toHaveBeenCalled();
  });

  it("returns a warning when networkidle times out", async () => {
    mockWaitForLoadState.mockRejectedValueOnce(new Error("Timeout"));
    setupScrollThenHtml("<p>Hello</p>");

    const result = await fetchHumanHtml("https://example.com", null);

    expect(result.warning).toMatch(/Network did not reach idle state/);
  });

  it("closes the browser even when an error is thrown", async () => {
    mockEvaluate.mockResolvedValueOnce(true);
    mockEvaluate.mockResolvedValueOnce(null); // triggers throw

    await expect(fetchHumanHtml("https://example.com", null)).rejects.toThrow();
    expect(mockClose).toHaveBeenCalled();
  });

  it("passes pageTimeoutMs to page.goto", async () => {
    setupScrollThenHtml("<p>Hi</p>");

    await fetchHumanHtml("https://example.com", null, { pageTimeoutMs: 30_000 });

    expect(mockGoto).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ timeout: 30_000 }),
    );
  });

  it("respects scrollMax option", async () => {
    // With scrollMax=2 and each scroll step returning false (not at bottom),
    // evaluate should be called exactly 2 times for scrolling + 1 for main innerHTML.
    mockEvaluate.mockResolvedValueOnce(false); // scroll 1
    mockEvaluate.mockResolvedValueOnce(false); // scroll 2
    mockEvaluate.mockResolvedValueOnce("<p>Done</p>"); // main innerHTML

    const result = await fetchHumanHtml("https://example.com", null, {
      scrollMax: 2,
    });

    expect(result.html).toBe("<p>Done</p>");
    // evaluate was called exactly 3 times (2 scroll + 1 main)
    expect(mockEvaluate).toHaveBeenCalledTimes(3);
  });
});
