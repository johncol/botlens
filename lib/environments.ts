export type Environment = "production" | "staging" | "development" | "uat";

export const ENVIRONMENTS: Record<
  Environment,
  { label: string; subdomain: string | null; requiresAuth: boolean }
> = {
  production: { label: "Production", subdomain: null, requiresAuth: false },
  staging: { label: "Staging", subdomain: "staging", requiresAuth: true },
  development: {
    label: "Development",
    subdomain: "development",
    requiresAuth: true,
  },
  uat: { label: "UAT", subdomain: "uat.qa", requiresAuth: true },
};

export const ENVIRONMENT_ORDER: Environment[] = [
  "production",
  "staging",
  "development",
  "uat",
];

/** Strips the www. prefix to get the registrable base domain. */
export function getBaseDomain(domain: string): string {
  return domain.replace(/^www\./, "");
}

/** Returns the hostname for the given environment derived from the production domain. */
export function getHostname(prodDomain: string, env: Environment): string {
  const { subdomain } = ENVIRONMENTS[env];
  if (subdomain === null) return prodDomain;
  return `${subdomain}.${getBaseDomain(prodDomain)}`;
}

/** Builds a full HTTPS URL from a production domain, path, and environment. */
export function buildUrl(
  prodDomain: string,
  path: string,
  env: Environment,
): string {
  const hostname = getHostname(prodDomain, env);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${hostname}${normalizedPath}`;
}

/** Detects which environment a URL belongs to, given the production domain. */
export function detectEnvironment(
  url: string,
  prodDomain: string,
): Environment | null {
  try {
    const { hostname } = new URL(url);
    for (const env of ENVIRONMENT_ORDER) {
      if (hostname === getHostname(prodDomain, env)) return env;
    }
  } catch {
    /* ignore */
  }
  return null;
}
