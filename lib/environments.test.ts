import { describe, it, expect } from "vitest";
import {
  getBaseDomain,
  getHostname,
  buildUrl,
  detectEnvironment,
  ENVIRONMENTS,
  ENVIRONMENT_ORDER,
} from "./environments";

describe("getBaseDomain", () => {
  it("strips www. prefix", () => {
    expect(getBaseDomain("www.example.com")).toBe("example.com");
  });

  it("returns apex domain unchanged", () => {
    expect(getBaseDomain("example.com")).toBe("example.com");
  });

  it("does not strip other subdomains", () => {
    expect(getBaseDomain("staging.example.com")).toBe("staging.example.com");
  });
});

describe("getHostname", () => {
  it("returns the production domain as-is (www variant)", () => {
    expect(getHostname("www.example.com", "production")).toBe(
      "www.example.com",
    );
  });

  it("returns the production domain as-is (apex variant)", () => {
    expect(getHostname("example.com", "production")).toBe("example.com");
  });

  it("prepends staging subdomain to base domain", () => {
    expect(getHostname("www.example.com", "staging")).toBe(
      "staging.example.com",
    );
  });

  it("prepends development subdomain to base domain", () => {
    expect(getHostname("example.com", "development")).toBe(
      "development.example.com",
    );
  });

  it("prepends uat.qa subdomain to base domain", () => {
    expect(getHostname("example.com", "uat")).toBe("uat.qa.example.com");
  });
});

describe("buildUrl", () => {
  it("builds a production URL", () => {
    expect(buildUrl("www.example.com", "/en/product", "production")).toBe(
      "https://www.example.com/en/product",
    );
  });

  it("builds a staging URL", () => {
    expect(buildUrl("www.example.com", "/en/category", "staging")).toBe(
      "https://staging.example.com/en/category",
    );
  });

  it("preserves query string and hash", () => {
    expect(
      buildUrl("example.com", "/en/product?color=black#details", "uat"),
    ).toBe("https://uat.qa.example.com/en/product?color=black#details");
  });

  it("prepends a slash when path has none", () => {
    expect(buildUrl("example.com", "en/product", "production")).toBe(
      "https://example.com/en/product",
    );
  });
});

describe("detectEnvironment", () => {
  it("detects production (www domain)", () => {
    expect(
      detectEnvironment("https://www.example.com/en", "www.example.com"),
    ).toBe("production");
  });

  it("detects production (apex domain)", () => {
    expect(detectEnvironment("https://example.com/en", "example.com")).toBe(
      "production",
    );
  });

  it("detects staging", () => {
    expect(
      detectEnvironment("https://staging.example.com/en", "www.example.com"),
    ).toBe("staging");
  });

  it("detects development", () => {
    expect(
      detectEnvironment("https://development.example.com/en", "example.com"),
    ).toBe("development");
  });

  it("detects uat", () => {
    expect(
      detectEnvironment("https://uat.qa.example.com/en", "example.com"),
    ).toBe("uat");
  });

  it("returns null for an unknown hostname", () => {
    expect(
      detectEnvironment("https://unknown.other.com/en", "example.com"),
    ).toBeNull();
  });

  it("returns null for an invalid URL", () => {
    expect(detectEnvironment("not-a-url", "example.com")).toBeNull();
  });
});

describe("ENVIRONMENTS config", () => {
  it("production does not require auth", () => {
    expect(ENVIRONMENTS.production.requiresAuth).toBe(false);
  });

  it("staging requires auth", () => {
    expect(ENVIRONMENTS.staging.requiresAuth).toBe(true);
  });

  it("development requires auth", () => {
    expect(ENVIRONMENTS.development.requiresAuth).toBe(true);
  });

  it("uat requires auth", () => {
    expect(ENVIRONMENTS.uat.requiresAuth).toBe(true);
  });
});

describe("ENVIRONMENT_ORDER", () => {
  it("contains all four environments", () => {
    expect(ENVIRONMENT_ORDER).toEqual(
      expect.arrayContaining(["production", "staging", "development", "uat"]),
    );
    expect(ENVIRONMENT_ORDER).toHaveLength(4);
  });

  it("lists production first", () => {
    expect(ENVIRONMENT_ORDER[0]).toBe("production");
  });
});
