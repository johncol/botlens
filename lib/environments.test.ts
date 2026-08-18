import { describe, it, expect } from "vitest";
import {
  getBaseDomain,
  getHostname,
  buildUrl,
  getAvailableEnvironments,
  isValidPort,
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

  it("appends the port for the local environment", () => {
    expect(
      getHostname("example.com", "local", { localPort: "3001" }),
    ).toBe("localhost:3001");
  });

  it("omits the port for the local environment when none is given", () => {
    expect(getHostname("example.com", "local")).toBe("localhost");
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

  it("builds an http localhost URL on the given port", () => {
    expect(
      buildUrl("example.com", "/en/product", "local", { localPort: "3001" }),
    ).toBe("http://localhost:3001/en/product");
  });

  it.each(["", "abc", "0", "65536", " 3000 "])(
    "throws for the local environment when the port is %j",
    (localPort) => {
      expect(() =>
        buildUrl("example.com", "/en", "local", { localPort }),
      ).toThrow(/port between 1 and 65535/);
    },
  );

  it("throws for the local environment when no port is given", () => {
    expect(() => buildUrl("example.com", "/en", "local")).toThrow();
  });
});

describe("isValidPort", () => {
  it.each(["1", "80", "3000", "65535"])("accepts %j", (port) => {
    expect(isValidPort(port)).toBe(true);
  });

  it.each(["", "0", "65536", "-1", "3000abc", "0x0BB8", " 3000", "30.00"])(
    "rejects %j",
    (port) => {
      expect(isValidPort(port)).toBe(false);
    },
  );
});

describe("getAvailableEnvironments", () => {
  it("includes local when local is available", () => {
    expect(getAvailableEnvironments(true)).toEqual(ENVIRONMENT_ORDER);
  });

  it("excludes local when local is not available", () => {
    const environments = getAvailableEnvironments(false);
    expect(environments).not.toContain("local");
    expect(environments).toHaveLength(ENVIRONMENT_ORDER.length - 1);
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

  it("local requires auth", () => {
    expect(ENVIRONMENTS.local.requiresAuth).toBe(true);
  });
});

describe("ENVIRONMENT_ORDER", () => {
  it("contains all five environments", () => {
    expect(ENVIRONMENT_ORDER).toEqual(
      expect.arrayContaining([
        "production",
        "staging",
        "development",
        "uat",
        "local",
      ]),
    );
    expect(ENVIRONMENT_ORDER).toHaveLength(5);
  });

  it("lists production first", () => {
    expect(ENVIRONMENT_ORDER[0]).toBe("production");
  });
});
