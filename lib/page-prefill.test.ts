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
      }),
    ).toEqual({
      domain: "www.example.com",
      page: "/en/clothing",
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
      },
    });
  });

  it("leaves missing development variables blank", () => {
    expect(
      getPageInitialValues({ NODE_ENV: "development" }),
    ).toEqual({
      domain: "",
      page: "",
      credentials: {
        staging: { username: "", password: "" },
        development: { username: "", password: "" },
        uat: { username: "", password: "" },
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
        }),
      ).toEqual({ domain: "", page: "", credentials: {} });
    },
  );
});
