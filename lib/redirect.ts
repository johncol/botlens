/** Returns `raw` if it is a safe relative path, otherwise returns `"/"`. */
export function safeRedirectPath(raw: unknown): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}
