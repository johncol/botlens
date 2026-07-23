import type { Environment } from "./environments";

export interface CrawlerCredentials {
  username: string;
  password: string;
}

export interface CrawlerComparisonInitialValues {
  domain: string;
  page: string;
  credentials: Partial<Record<Environment, CrawlerCredentials>>;
}

const EMPTY_INITIAL_VALUES: CrawlerComparisonInitialValues = {
  domain: "",
  page: "",
  credentials: {},
};

export function getCrawlerComparisonInitialValues(
  env: NodeJS.ProcessEnv,
): CrawlerComparisonInitialValues {
  if (env.NODE_ENV !== "development") {
    return EMPTY_INITIAL_VALUES;
  }

  return {
    domain: env.DOMAIN ?? "",
    page: env.PAGE ?? "",
    credentials: {
      staging: {
        username: env.STAGING_USER ?? "",
        password: env.STAGING_PASSWORD ?? "",
      },
      development: {
        username: env.DEVELOPMENT_USER ?? "",
        password: env.DEVELOPMENT_PASSWORD ?? "",
      },
      uat: {
        username: env.UAT_USER ?? "",
        password: env.UAT_PASSWORD ?? "",
      },
    },
  };
}