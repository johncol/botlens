export type Environment =
  | "production"
  | "staging"
  | "development"
  | "uat"
  | "local";

/**
 * `kind` describes how the hostname is derived:
 * - `domain`: the production domain, used as-is
 * - `subdomain`: a subdomain prepended to the base production domain
 * - `localhost`: the developer's machine on a user-supplied port
 */
export type EnvironmentConfig =
  | { kind: "domain"; label: string; requiresAuth: boolean }
  | {
      kind: "subdomain";
      label: string;
      subdomain: string;
      requiresAuth: boolean;
    }
  | { kind: "localhost"; label: string; requiresAuth: boolean };

export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  production: { kind: "domain", label: "Production", requiresAuth: false },
  staging: {
    kind: "subdomain",
    label: "Staging",
    subdomain: "staging",
    requiresAuth: true,
  },
  development: {
    kind: "subdomain",
    label: "Development",
    subdomain: "development",
    requiresAuth: true,
  },
  uat: {
    kind: "subdomain",
    label: "UAT",
    subdomain: "uat.qa",
    requiresAuth: true,
  },
  local: { kind: "localhost", label: "Local", requiresAuth: true },
};

export const ENVIRONMENT_ORDER: Environment[] = [
  "production",
  "staging",
  "development",
  "uat",
  "local",
];

export const LOCAL_HOSTNAME = "localhost";

export const MIN_PORT = 1;
export const MAX_PORT = 65535;

export type BuildUrlOptions = {
  /** Required when the environment is Local. */
  localPort?: string;
};

/** Returns the environments the user may select, given whether Local is reachable. */
export function getAvailableEnvironments(
  isLocalAvailable: boolean,
): Environment[] {
  return ENVIRONMENT_ORDER.filter(
    (env) => isLocalAvailable || ENVIRONMENTS[env].kind !== "localhost",
  );
}

/** True when the value is digits only and within the valid TCP port range. */
export function isValidPort(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }
  const port = Number(value);
  return port >= MIN_PORT && port <= MAX_PORT;
}

/** Strips the www. prefix to get the registrable base domain. */
export function getBaseDomain(domain: string): string {
  return domain.replace(/^www\./, "");
}

/**
 * Returns the hostname for the given environment derived from the production
 * domain. Lenient by design: a Local hostname without a port renders as
 * `localhost`, so the UI can display it while the user still types the port.
 */
export function getHostname(
  prodDomain: string,
  env: Environment,
  options: BuildUrlOptions = {},
): string {
  const config = ENVIRONMENTS[env];
  switch (config.kind) {
    case "domain":
      return prodDomain;
    case "subdomain":
      return `${config.subdomain}.${getBaseDomain(prodDomain)}`;
    case "localhost":
      return options.localPort
        ? `${LOCAL_HOSTNAME}:${options.localPort}`
        : LOCAL_HOSTNAME;
  }
}

/** Builds a full URL from a production domain, path, and environment. */
export function buildUrl(
  prodDomain: string,
  path: string,
  env: Environment,
  options: BuildUrlOptions = {},
): string {
  const config = ENVIRONMENTS[env];
  if (config.kind === "localhost" && !isValidPort(options.localPort ?? "")) {
    throw new Error(
      `A port between ${MIN_PORT} and ${MAX_PORT} is required to build a ${config.label} URL`,
    );
  }
  const scheme = config.kind === "localhost" ? "http" : "https";
  const hostname = getHostname(prodDomain, env, options);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${scheme}://${hostname}${normalizedPath}`;
}
