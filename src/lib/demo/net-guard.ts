// The demo makes the server fetch a URL a stranger typed, so every hop is
// checked before it is followed: scheme, port, hostname, and the addresses the
// hostname actually resolves to. Without this, "scrape this page for me" is an
// open door to the droplet's own services and the cloud metadata endpoint.

import { lookup } from "node:dns/promises";

const blockedHostSuffixes = [".localhost", ".local", ".internal", ".home.arpa", ".onion"];
const blockedHosts = new Set(["localhost", "metadata.google.internal", "instance-data"]);

export type UrlCheck = { ok: true; url: URL } | { ok: false; reason: string };

function parseIpv4(value: string): number[] | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return -1;
    const n = Number(part);
    return n > 255 ? -1 : n;
  });
  return octets.some((n) => n < 0) ? null : octets;
}

// Each reserved block is matched at its real size. Widening one to a whole /16
// would lock out ordinary public space: 192.0.43.8 (iana.org) is a neighbour of
// the 192.0.2.0/24 documentation range and must still be reachable.
function privateIpv4([a, b, c]: number[]) {
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier NAT
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // protocol assignments, TEST-NET-1
  if (a === 192 && b === 88 && c === 99) return true; // deprecated 6to4 relay anycast
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast and everything reserved above it
  return false;
}

/** True when the host is a literal address rather than a name to resolve. */
export function isIpLiteral(host: string) {
  const value = host.replace(/^\[|\]$/g, "");
  return value.includes(":") || /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

/**
 * True for any address the demo crawler must never be pointed at. Anything that
 * is not a recognisable address counts as private: callers pass literals and
 * resolved addresses, so "unrecognisable" means something has gone wrong.
 */
export function isPrivateAddress(address: string): boolean {
  const value = address
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  const v4 = parseIpv4(value);
  if (v4) return privateIpv4(v4);

  if (!value.includes(":")) return true; // not an address we can reason about

  // IPv4 carried inside IPv6: ::ffff:a.b.c.d and the NAT64 prefix.
  const tail = value.slice(value.lastIndexOf(":") + 1);
  const embedded = parseIpv4(tail);
  if (embedded) return privateIpv4(embedded);

  if (value === "::" || value === "::1") return true;
  if (
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb")
  )
    return true; // fe80::/10
  if (/^f[cd]/.test(value)) return true; // fc00::/7 unique local
  if (value.startsWith("ff")) return true; // multicast
  if (value.startsWith("2001:db8")) return true; // documentation
  if (value.startsWith("2002:")) return true; // deprecated 6to4
  if (value.startsWith("::")) return true; // ::/96 and friends
  return false;
}

/** Scheme, port and hostname checks that need no network. */
export function checkUrlShape(raw: string): UrlCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "That doesn't look like a web address" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http and https pages can be scraped" };
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    return { ok: false, reason: "Only the standard web ports 80 and 443 are allowed" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "Remove the credentials from the URL" };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || blockedHosts.has(host) || blockedHostSuffixes.some((s) => host.endsWith(s))) {
    return { ok: false, reason: "That host is not reachable from the public internet" };
  }
  if (isIpLiteral(host) && isPrivateAddress(host)) {
    return { ok: false, reason: "Private and loopback addresses can't be scraped" };
  }
  if (!host.includes(".")) {
    return { ok: false, reason: "Enter a full domain, e.g. example-store.com" };
  }
  return { ok: true, url };
}

/** Shape check plus DNS: every address the host resolves to must be public. */
export async function checkUrlReachable(raw: string): Promise<UrlCheck> {
  const shape = checkUrlShape(raw);
  if (!shape.ok) return shape;

  let addresses: { address: string }[];
  try {
    addresses = await lookup(shape.url.hostname, { all: true });
  } catch {
    return { ok: false, reason: "That domain doesn't resolve — check the spelling" };
  }
  if (addresses.length === 0) return { ok: false, reason: "That domain doesn't resolve" };
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    return { ok: false, reason: "That domain points at a private address" };
  }
  return shape;
}
