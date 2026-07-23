import { describe, it, expect } from "vitest";
import { stripStyleTags, htmlToMarkdown } from "./html-to-markdown";

describe("stripStyleTags", () => {
  it("removes a style block", () => {
    expect(stripStyleTags("<style>body { color: red; }</style><p>Hello</p>")).toBe(
      "<p>Hello</p>",
    );
  });

  it("removes multiple style blocks", () => {
    expect(
      stripStyleTags(
        "<style>a{}</style><p>One</p><style>b{}</style><p>Two</p>",
      ),
    ).toBe("<p>One</p><p>Two</p>");
  });

  it("is case-insensitive for the tag name", () => {
    expect(stripStyleTags("<STYLE>body{}</STYLE><p>hi</p>")).toBe("<p>hi</p>");
  });

  it("removes style blocks with attributes", () => {
    expect(stripStyleTags('<style type="text/css">a{}</style><p>Hi</p>')).toBe(
      "<p>Hi</p>",
    );
  });

  it("returns the string unchanged when there are no style tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    expect(stripStyleTags(input)).toBe(input);
  });
});

describe("htmlToMarkdown", () => {
  it("converts a heading", () => {
    expect(htmlToMarkdown("<h1>Title</h1>")).toContain("# Title");
  });

  it("converts a paragraph", () => {
    expect(htmlToMarkdown("<p>Hello world</p>")).toContain("Hello world");
  });

  it("converts a link", () => {
    expect(
      htmlToMarkdown('<a href="https://example.com">Example</a>'),
    ).toContain("[Example](https://example.com)");
  });

  it("strips style tags before conversion", () => {
    const result = htmlToMarkdown("<style>body{color:red}</style><p>Clean</p>");
    expect(result).toContain("Clean");
    expect(result).not.toContain("body{color:red}");
  });

  it("converts a video tag with src to a markdown link", () => {
    const result = htmlToMarkdown(
      '<video src="video.mp4" title="Demo"></video>',
    );
    expect(result).toContain("[Demo](video.mp4)");
  });

  it("renders a video with poster but no src as a poster link", () => {
    const result = htmlToMarkdown('<video poster="thumb.jpg"></video>');
    expect(result).toContain("[VideoPoster](thumb.jpg)");
  });

  it("ignores a video with no src or poster", () => {
    const result = htmlToMarkdown("<video></video>");
    expect(result).not.toContain("[Video]");
    expect(result).not.toContain("[VideoPoster]");
  });
});
