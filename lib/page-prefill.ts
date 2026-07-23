import type { Environment } from "./environments";

export interface PageCredentials {
  username: string;
  password: string;
}

/**
 * Initial values used to pre-populate domain/page/credentials inputs on any
 * page that fetches a URL from a known environment. Populated from environment
 * variables in development only — never in production.
 */
export interface PageInitialValues {
  domain: string;
  page: string;
  credentials: Partial<Record<Environment, PageCredentials>>;
}

const EMPTY_INITIAL_VALUES: PageInitialValues = {
  domain: "",
  page: "",
  credentials: {},
};

/**
 * Reads `DOMAIN`, `PAGE`, and per-environment credential env vars and returns
 * pre-populated initial values for use during local development.
 *
 * Returns empty values in all non-development environments to avoid leaking
 * internal hostnames or credentials into production builds.
 */
export function getPageInitialValues(
  env: NodeJS.ProcessEnv,
): PageInitialValues {
  if (env.NODE_ENV !== "development") return EMPTY_INITIAL_VALUES;

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
