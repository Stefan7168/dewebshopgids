// Domain age (plan v3 section 8, step 6): SIDN WHOIS creation date plus the
// Wayback first capture. "Online sinds ongeveer" is shown only when both agree
// within 2 years; the shown year is the Wayback first capture (evidence of being online).
import { connect as netConnect } from "node:net";

export function parseSidnCreationDate(whois: string): Date | null {
  const m = /^\s*Creation Date:\s*(\d{4})-(\d{2})-(\d{2})/im.exec(whois);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

export function isSidnRateLimited(whois: string): boolean {
  return /maximum number of requests|limit exceeded|too many requests/i.test(whois);
}

const TWO_YEARS_MS = 2 * 365.25 * 24 * 3600 * 1000;

export function combineDomainAge(whois: Date | null, wayback: Date | null): {
  domain_first_seen: Date | null;
  show: boolean;
  sources: { whois: string | null; wayback: string | null };
} {
  const sources = {
    whois: whois?.toISOString().slice(0, 10) ?? null,
    wayback: wayback?.toISOString().slice(0, 10) ?? null,
  };
  if (!whois || !wayback) return { domain_first_seen: wayback ?? whois, show: false, sources };
  const agree = Math.abs(whois.getTime() - wayback.getTime()) <= TWO_YEARS_MS;
  return { domain_first_seen: wayback, show: agree, sources };
}

/** Raw WHOIS lookup for a .nl domain over TCP 43. Callers must rate limit (1 per 10 s). */
export function whoisNl(domain: string, timeoutMs = 10_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = netConnect(43, "whois.domain-registry.nl");
    let data = "";
    socket.setTimeout(timeoutMs, () => socket.destroy(new Error("whois timeout")));
    socket.on("connect", () => socket.write(`${domain}\r\n`));
    socket.on("data", (chunk) => (data += chunk.toString("utf8")));
    socket.on("end", () => resolve(data));
    socket.on("error", reject);
  });
}
