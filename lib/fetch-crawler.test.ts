import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchCrawlerHtml } from "./fetch-crawler";

function makeResponse(
  body: string,
  ok = true,
  status = 200,
  statusText = "OK",
) {
  const encoded = new TextEncoder().encode(body);
  return {
    ok,
    status,
    statusText,
    arrayBuffer: () => Promise.resolve(encoded.buffer as ArrayBuffer),
  };
}

describe("fetchCrawlerHtml", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the inner HTML of <main> on success", async () => {
    const html =
      "<html><body><main><p>Content</p></main></body></html>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(html)));

    const result = await fetchCrawlerHtml(
      "https://example.com",
      "TestBot/1.0",
      null,
    );

    expect(result).toContain("<p>Content</p>");
  });

  it("sends the correct User-Agent header", async () => {
    const html = "<html><body><main><p>Hi</p></main></body></html>";
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(html));
    vi.stubGlobal("fetch", mockFetch);

    await fetchCrawlerHtml("https://example.com", "GPTBot/1.0", null);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: expect.objectContaining({ "User-Agent": "GPTBot/1.0" }),
      }),
    );
  });

  it("sends an Authorization header when credentials are provided", async () => {
    const html = "<html><body><main><p>Hi</p></main></body></html>";
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(html));
    vi.stubGlobal("fetch", mockFetch);

    await fetchCrawlerHtml("https://example.com", "Bot/1.0", {
      username: "u",
      password: "p",
    });

    const expectedAuth = `Basic ${Buffer.from("u:p").toString("base64")}`;
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expectedAuth }),
      }),
    );
  });

  it("does not send an Authorization header when credentials are null", async () => {
    const html = "<html><body><main><p>Hi</p></main></body></html>";
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(html));
    vi.stubGlobal("fetch", mockFetch);

    await fetchCrawlerHtml("https://example.com", "Bot/1.0", null);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
  });

  it("throws when the remote server responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse("", false, 403, "Forbidden"),
      ),
    );

    await expect(
      fetchCrawlerHtml("https://example.com", "Bot/1.0", null),
    ).rejects.toThrow("Remote server returned 403 Forbidden");
  });

  it("throws when the response exceeds the default size limit", async () => {
    const bigBuffer = new ArrayBuffer(3 * 1024 * 1024); // 3 MB > 2 MB default
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(bigBuffer),
    }));

    await expect(
      fetchCrawlerHtml("https://example.com", "Bot/1.0", null),
    ).rejects.toThrow("Remote page too large");
  });

  it("throws when no <main> element is found", async () => {
    const html = "<html><body><p>No main here</p></body></html>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(html)));

    await expect(
      fetchCrawlerHtml("https://example.com", "Bot/1.0", null),
    ).rejects.toThrow("No <main> element found");
  });

  it("respects a custom maxHtmlBytes option", async () => {
    const buffer = new ArrayBuffer(600 * 1024); // 600 KB
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(buffer),
    }));

    await expect(
      fetchCrawlerHtml("https://example.com", "Bot/1.0", null, {
        maxHtmlBytes: 500 * 1024, // 500 KB limit
      }),
    ).rejects.toThrow("Remote page too large");
  });
});
