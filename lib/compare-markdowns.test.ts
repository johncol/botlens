import { describe, it, expect } from "vitest";
import { compareMarkdowns } from "./compare-markdowns";

describe("compareMarkdowns", () => {
  it("returns isIdentical=true for equal strings", () => {
    const result = compareMarkdowns("# Hello\n\nWorld", "# Hello\n\nWorld");
    expect(result.isIdentical).toBe(true);
    expect(result.addedLines).toBe(0);
    expect(result.removedLines).toBe(0);
  });

  it("returns isIdentical=false for different strings", () => {
    const result = compareMarkdowns("# Hello\n\nWorld", "# Hello\n\nChanged");
    expect(result.isIdentical).toBe(false);
  });

  it("counts added lines correctly", () => {
    const human = "line1\nline2\n";
    const crawler = "line1\nline2\nline3\n";
    const result = compareMarkdowns(human, crawler);
    expect(result.addedLines).toBeGreaterThan(0);
    expect(result.removedLines).toBe(0);
  });

  it("counts removed lines correctly", () => {
    const human = "line1\nline2\nline3\n";
    const crawler = "line1\n";
    const result = compareMarkdowns(human, crawler);
    expect(result.removedLines).toBeGreaterThan(0);
  });

  it("returns a hunks array", () => {
    const result = compareMarkdowns("a\nb\n", "a\nc\n");
    expect(Array.isArray(result.hunks)).toBe(true);
    expect(result.hunks.length).toBeGreaterThan(0);
  });

  it("marks added hunks with added=true", () => {
    const result = compareMarkdowns("a\n", "a\nnew line\n");
    const addedHunk = result.hunks.find((h) => h.added);
    expect(addedHunk).toBeDefined();
  });

  it("marks removed hunks with removed=true", () => {
    const result = compareMarkdowns("a\nremoved\n", "a\n");
    const removedHunk = result.hunks.find((h) => h.removed);
    expect(removedHunk).toBeDefined();
  });

  it("handles empty strings as identical", () => {
    const result = compareMarkdowns("", "");
    expect(result.isIdentical).toBe(true);
    expect(result.addedLines).toBe(0);
    expect(result.removedLines).toBe(0);
  });

  it("defaults to strict mode", () => {
    const result = compareMarkdowns("[Video](v.mp4)\n", "[VideoPoster](p.jpg)\n");
    expect(result.isIdentical).toBe(false);
  });
});

describe("compareMarkdowns — non-strict mode", () => {
  it("treats [Video](url) and [VideoPoster](url) as equal", () => {
    const result = compareMarkdowns(
      "[Video](video.mp4)\n",
      "[VideoPoster](poster.jpg)\n",
      false,
    );
    expect(result.isIdentical).toBe(true);
    expect(result.addedLines).toBe(0);
    expect(result.removedLines).toBe(0);
  });

  it("considers identical surrounding lines unaffected", () => {
    const human = "# Title\n[Video](video.mp4)\nSome text\n";
    const crawler = "# Title\n[VideoPoster](poster.jpg)\nSome text\n";
    const result = compareMarkdowns(human, crawler, false);
    expect(result.isIdentical).toBe(true);
  });

  it("still detects genuine differences in non-strict mode", () => {
    const human = "[Video](video.mp4)\nHuman content\n";
    const crawler = "[VideoPoster](poster.jpg)\nCrawler content\n";
    const result = compareMarkdowns(human, crawler, false);
    expect(result.isIdentical).toBe(false);
  });

  it("does not apply the rule in reverse (crawler=[Video], human=[VideoPoster])", () => {
    const result = compareMarkdowns(
      "[VideoPoster](poster.jpg)\n",
      "[Video](video.mp4)\n",
      false,
    );
    expect(result.isIdentical).toBe(false);
  });

  it("requires a non-empty URL in the video link", () => {
    const result = compareMarkdowns("[Video]()\n", "[VideoPoster]()\n", false);
    expect(result.isIdentical).toBe(false);
  });

  it("strict=true still treats [Video] and [VideoPoster] as different", () => {
    const result = compareMarkdowns(
      "[Video](video.mp4)\n",
      "[VideoPoster](poster.jpg)\n",
      true,
    );
    expect(result.isIdentical).toBe(false);
  });
});
