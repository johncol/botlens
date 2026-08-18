import { describe, it, expect } from "vitest";
import { toErrorMessage, settledValue, settledError } from "./errors";

describe("toErrorMessage", () => {
  it("returns the message of an Error", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns the default fallback for a non-Error value", () => {
    expect(toErrorMessage("boom")).toBe("Unknown error");
  });

  it("returns a custom fallback for a non-Error value", () => {
    expect(toErrorMessage(null, "Network error")).toBe("Network error");
  });
});

describe("settledValue", () => {
  it("returns the value of a fulfilled result", () => {
    expect(settledValue({ status: "fulfilled", value: "html" })).toBe("html");
  });

  it("returns null for a rejected result", () => {
    expect(
      settledValue({ status: "rejected", reason: new Error("boom") }),
    ).toBeNull();
  });
});

describe("settledError", () => {
  it("returns undefined for a fulfilled result", () => {
    expect(settledError({ status: "fulfilled", value: "html" })).toBeUndefined();
  });

  it("returns the rejection message", () => {
    expect(settledError({ status: "rejected", reason: new Error("boom") })).toBe(
      "boom",
    );
  });

  it("falls back when the rejection is not an Error", () => {
    expect(settledError({ status: "rejected", reason: 42 })).toBe(
      "Unknown error",
    );
  });
});
