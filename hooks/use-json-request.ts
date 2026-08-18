"use client";

import { useCallback, useState } from "react";
import { toErrorMessage } from "@/lib/errors";

/**
 * Wraps the POST-JSON request lifecycle every tool repeats: loading flag, error
 * message from either the response payload or a network failure, and the parsed
 * response body. Returns null when the request failed.
 */
export function useJsonRequest<TResponse>(endpoint: string, failureMessage: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (payload: unknown): Promise<TResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? failureMessage);
          return null;
        }
        return data as TResponse;
      } catch (caught) {
        setError(toErrorMessage(caught, "Network error"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, failureMessage],
  );

  return { isLoading, error, setError, send };
}
