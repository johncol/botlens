"use client";

import { useCallback, useState } from "react";
import type { Environment } from "@/lib/environments";
import type { PageCredentials } from "@/lib/page-prefill";

export type EnvironmentCredentials = Partial<
  Record<Environment, PageCredentials>
>;

/** Shared so an environment without credentials always yields the same object. */
const EMPTY_CREDENTIALS: PageCredentials = { username: "", password: "" };

/**
 * Holds per-environment basic-auth credentials in React state only. Credentials
 * are never written to localStorage or any other persistent store.
 */
export function useEnvironmentCredentials(initial: EnvironmentCredentials) {
  const [credentials, setCredentials] = useState<EnvironmentCredentials>(initial);

  const getCredentials = useCallback(
    (env: Environment): PageCredentials => credentials[env] ?? EMPTY_CREDENTIALS,
    [credentials],
  );

  const updateCredential = useCallback(
    (env: Environment, field: keyof PageCredentials, value: string) => {
      setCredentials((previous) => ({
        ...previous,
        [env]: { ...(previous[env] ?? EMPTY_CREDENTIALS), [field]: value },
      }));
    },
    [],
  );

  return { credentials, getCredentials, updateCredential };
}

export function hasCompleteCredentials(credentials: PageCredentials): boolean {
  return (
    credentials.username.trim().length > 0 &&
    credentials.password.trim().length > 0
  );
}
