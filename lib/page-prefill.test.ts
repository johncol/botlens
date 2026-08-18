import { describe, expect, it } from "vitest";
import { getPageInitialValues } from "./page-prefill";

describe("getPageInitialValues", () => {
  it("maps development environment variables to initial values", () => {
    expect(
      getPageInitialValues({
        NODE_ENV: "development",
        DOMAIN: "www.example.com",
        PAGE: "/en/clothing",
        STAGING_USER: "staging-user",
        STAGING_PASSWORD: "staging-password",
        DEVELOPMENT_USER: "development-user",
        DEVELOPMENT_PASSWORD: "development-password",
        UAT_USER: "uat-user",
        UAT_PASSWORD: "uat-password",
        LOCAL_PORT: "3001",
        LOCAL_USER: "local-user",
        LOCAL_PASSWORD: "local-password",
      }),
    ).toEqual({
      domain: "www.example.com",
      page: "/en/clothing",
      localPort: "3001",
      credentials: {
        staging: {
          username: "staging-user",
          password: "staging-password",
        },
        development: {
          username: "development-user",
          password: "development-password",
        },
        uat: { username: "uat-user", password: "uat-password" },
        local: { username: "local-user", password: "local-password" },
      },
    });
  });

  it("leaves missing development variables blank", () => {
    expect(
      getPageInitialValues({ NODE_ENV: "development" }),
    ).toEqual({
      domain: "",
      page: "",
      localPort: "",
      credentials: {
        staging: { username: "", password: "" },
        development: { username: "", password: "" },
        uat: { username: "", password: "" },
        local: { username: "", password: "" },
      },
    });
  });

  it.each(["production", "test"] as const)(
    "ignores variables when NODE_ENV is %s",
    (nodeEnv) => {
      expect(
        getPageInitialValues({
          NODE_ENV: nodeEnv,
          DOMAIN: "www.example.com",
          PAGE: "/secret-page",
          STAGING_USER: "user",
          STAGING_PASSWORD: "password",
          LOCAL_PORT: "3001",
          LOCAL_USER: "local-user",
          LOCAL_PASSWORD: "local-password",
        }),
      ).toEqual({ domain: "", page: "", localPort: "", credentials: {} });
    },
  );
});
