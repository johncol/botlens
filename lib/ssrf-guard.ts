import dns from "node:dns/promises";

// Matches private / loopback / link-local ranges for IPv4 and common IPv6 forms.
const PRIVATE_IP_RE =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.|::1$|fc[0-9a-f]{2}:|fe[89ab][0-9a-f]:)/i;

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RE.test(ip);
}

/**
 * Throws if the URL's hostname resolves to a private/internal address.
 * Fails closed — any DNS resolution failure is treated as unsafe.
 */
export async function assertNotPrivateUrl(url: string): Promise<void> {
  const { hostname } = new URL(url);

  // Reject loopback / private literals without a DNS round-trip
  if (/^localhost$/i.test(hostname) || hostname === "::1") {
    throw new Error("Private/internal URLs are not allowed");
  }
  if (isPrivateIp(hostname)) {
    throw new Error("Private/internal URLs are not allowed");
  }

  // Resolve and check every returned address
  let addresses: string[] = [];
  try {
    addresses = await dns.resolve4(hostname);
  } catch {
    try {
      addresses = (await dns.resolve6(hostname)).map((a) =>
        a.replace(/^\[|\]$/g, ""),
      );
    } catch {
      throw new Error("Could not resolve hostname");
    }
  }

  if (addresses.some(isPrivateIp)) {
    throw new Error("Private/internal URLs are not allowed");
  }
}
