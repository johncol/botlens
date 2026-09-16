import { describe, it, expect } from "vitest";
import { applyClampedDelta } from "./use-synced-scroll";

describe("applyClampedDelta", () => {
  it("applies a positive delta within range", () => {
    expect(applyClampedDelta(100, 50, 500)).toBe(150);
  });

  it("applies a negative delta within range", () => {
    expect(applyClampedDelta(100, -50, 500)).toBe(50);
  });

  it("clamps at the top bound", () => {
    expect(applyClampedDelta(20, -50, 500)).toBe(0);
  });

  it("clamps at the bottom bound", () => {
    expect(applyClampedDelta(480, 50, 500)).toBe(500);
  });

  it("clamps to zero when the max scrollable range is negative", () => {
    expect(applyClampedDelta(0, 10, -5)).toBe(0);
  });
});
