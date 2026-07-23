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
});
