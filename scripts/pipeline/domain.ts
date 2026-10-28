// Normalise a shop URL or host to the bare domain we store: lowercase, no scheme,
// no "www.", no path, no port. Returns null for anything that is not a public host.
export function normalizeDomain(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s) return null;
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  let host: string;
  try {
    host = new URL(s).hostname;
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "").replace(/\.$/, "");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null;
  if (/^\d+(\.\d+){3}$/.test(host)) return null; // IP address
  return host;
}
