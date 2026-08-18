/** Extracts a readable message from an unknown thrown value. */
export function toErrorMessage(error: unknown, fallback = "Unknown error"): string {
  return error instanceof Error ? error.message : fallback;
}

/** Returns the fulfilled value, or null when the promise was rejected. */
export function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

/** Returns the rejection message, or undefined when the promise was fulfilled. */
export function settledError<T>(
  result: PromiseSettledResult<T>,
): string | undefined {
  return result.status === "rejected"
    ? toErrorMessage(result.reason)
    : undefined;
}
