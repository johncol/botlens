export const AUTH_COOKIE = "botlens-auth";
const MESSAGE = "botlens-auth-v1";
const enc = new TextEncoder();

async function importKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Derives the expected cookie token from the gate password. */
export async function deriveToken(password: string): Promise<string> {
  const key = await importKey(password);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(MESSAGE));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Returns true only when the supplied token matches the derived value (timing-safe). */
export async function verifyToken(
  password: string,
  token: string,
): Promise<boolean> {
  try {
    const key = await importKey(password);
    const tokenBytes = new Uint8Array(
      (token.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16)),
    );
    return crypto.subtle.verify("HMAC", key, tokenBytes, enc.encode(MESSAGE));
  } catch {
    return false;
  }
}
