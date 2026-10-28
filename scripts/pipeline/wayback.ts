// Wayback Machine first-capture lookup with its own, slower limiter
// (1 request per 10 s, 20 s timeout, backoff on 5xx). A 429 means
// "stop and retry next night": it throws WaybackRateLimited.
// Plan v3 section 8, step 2.
import { USER_AGENT, type FetchImpl } from "./fetch-polite";

export class WaybackRateLimited extends Error {
  constructor() {
    super("Wayback rate limit (429): retry next night");
    this.name = "WaybackRateLimited";
  }
}

export type WaybackDeps = {
  fetchImpl?: FetchImpl;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  minIntervalMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function createWaybackClient(deps: WaybackDeps = {}) {
  const fetchImpl = deps.fetchImpl ?? (globalThis.fetch as unknown as FetchImpl);
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? defaultSleep;
  const minIntervalMs = deps.minIntervalMs ?? 10_000;
  const timeoutMs = deps.timeoutMs ?? 20_000;
  const maxRetries = deps.maxRetries ?? 3;
  let last: number | undefined;

  async function get(url: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      if (last !== undefined) {
        const wait = last + minIntervalMs - now();
        if (wait > 0) await sleep(wait);
      }
      last = now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res: Response | undefined;
      let failure: unknown;
      try {
        res = await fetchImpl(url, { headers: { "User-Agent": USER_AGENT }, signal: controller.signal, redirect: "follow" });
      } catch (err) {
        failure = err;
      } finally {
        clearTimeout(timer);
      }
      if (res?.status === 429) throw new WaybackRateLimited();
      if (res && res.status < 500) return res;
      if (attempt >= maxRetries) {
        throw new Error(`Wayback failed after ${attempt + 1} attempts: ${res ? `HTTP ${res.status}` : String(failure)}`);
      }
      await sleep(minIntervalMs * 2 ** attempt); // backoff: 10 s, 20 s, 40 s
    }
  }

  /** Date of the first Wayback capture of the domain, or null if none. */
  async function firstCapture(domain: string): Promise<Date | null> {
    const api = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=1&fl=timestamp`;
    const res = await get(api);
    if (!res.ok) return null;
    const rows = (await res.json()) as string[][];
    const ts = rows?.[1]?.[0]; // rows[0] is the header row
    if (!ts || !/^\d{8}/.test(ts)) return null;
    return new Date(Date.UTC(+ts.slice(0, 4), +ts.slice(4, 6) - 1, +ts.slice(6, 8)));
  }

  return { firstCapture };
}
