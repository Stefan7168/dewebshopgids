// The only way pipeline code may fetch a shop page (CLAUDE.md section 5).
// - robots.txt per origin, cached, RFC 9309: 4xx = allow all, 5xx/network error = disallow all
// - at most 1 request per 3 s per domain (longer if robots.txt sets Crawl-delay, capped at 30 s)
// - 10 s timeout, 2 MB body cap, named User-Agent with a contact address
// Everything is injectable so tests run on fixtures without network.
import robotsParser from "robots-parser";
import { USER_AGENT_TOKEN } from "../../lib/site";

export const USER_AGENT =
  "DeWebshopgidsBot/0.1 (+https://dewebshopgids.nl/over; info@dewebshopgids.nl)";
const UA_TOKEN = USER_AGENT_TOKEN;

export type FetchImpl = (url: string, init: { headers: Record<string, string>; signal: AbortSignal; redirect: "follow" }) => Promise<Response>;

export type PoliteDeps = {
  fetchImpl?: FetchImpl;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  minIntervalMs?: number;
  timeoutMs?: number;
  maxBytes?: number;
};

export type PoliteResult =
  | { kind: "ok"; url: string; finalUrl: string; status: number; text: string; contentType: string; fetchedAt: Date }
  | { kind: "robots_disallowed"; url: string }
  | { kind: "error"; url: string; error: string };

const MAX_CRAWL_DELAY_MS = 30_000;

type Robot = ReturnType<typeof robotsParser>;
// unreachable: robots.txt gave 5xx or no answer. We stay out (RFC 9309), but report it as an
// error, not as the shop's choice, so a network outage cannot pass as a quiet night.
type RobotsEntry = { robot: Robot | null; allowAll: boolean; disallowAll: boolean; unreachable: boolean };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}

export function createPoliteFetcher(deps: PoliteDeps = {}) {
  const fetchImpl = deps.fetchImpl ?? (globalThis.fetch as unknown as FetchImpl);
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? defaultSleep;
  const minIntervalMs = deps.minIntervalMs ?? 3_000;
  const timeoutMs = deps.timeoutMs ?? 10_000;
  const maxBytes = deps.maxBytes ?? 2 * 1024 * 1024;

  const lastRequestAt = new Map<string, number>(); // per hostname
  const robotsCache = new Map<string, RobotsEntry>(); // per origin

  async function throttle(host: string, intervalMs: number) {
    const last = lastRequestAt.get(host);
    if (last !== undefined) {
      const wait = last + intervalMs - now();
      if (wait > 0) await sleep(wait);
    }
    lastRequestAt.set(host, now());
  }

  async function rawGet(url: string, intervalMs: number) {
    const host = new URL(url).hostname;
    await throttle(host, intervalMs);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xml;q=0.9,*/*;q=0.5" },
        signal: controller.signal,
        redirect: "follow",
      });
      const text = await readCapped(res, maxBytes);
      return { res, text };
    } finally {
      clearTimeout(timer);
    }
  }

  function intervalFor(entry: RobotsEntry | undefined) {
    const delay = entry?.robot?.getCrawlDelay(UA_TOKEN);
    return typeof delay === "number" && delay > 0
      ? Math.min(Math.max(delay * 1000, minIntervalMs), MAX_CRAWL_DELAY_MS)
      : minIntervalMs;
  }

  async function robotsFor(origin: string): Promise<RobotsEntry> {
    const cached = robotsCache.get(origin);
    if (cached) return cached;
    const robotsUrl = `${origin}/robots.txt`;
    let entry: RobotsEntry;
    try {
      const { res, text } = await rawGet(robotsUrl, minIntervalMs);
      if (res.status >= 200 && res.status < 300) {
        entry = { robot: robotsParser(robotsUrl, text), allowAll: false, disallowAll: false, unreachable: false };
      } else if (res.status >= 400 && res.status < 500) {
        entry = { robot: null, allowAll: true, disallowAll: false, unreachable: false };
      } else {
        entry = { robot: null, allowAll: false, disallowAll: true, unreachable: true };
      }
    } catch {
      entry = { robot: null, allowAll: false, disallowAll: true, unreachable: true };
    }
    robotsCache.set(origin, entry);
    return entry;
  }

  async function isAllowed(url: string): Promise<boolean> {
    const entry = await robotsFor(new URL(url).origin);
    if (entry.disallowAll) return false;
    if (entry.allowAll || !entry.robot) return true;
    return entry.robot.isAllowed(url, UA_TOKEN) !== false;
  }

  async function fetchPolite(url: string): Promise<PoliteResult> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { kind: "error", url, error: "invalid url" };
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { kind: "error", url, error: "unsupported protocol" };
    }
    if (!(await isAllowed(url))) {
      if (robotsCache.get(parsed.origin)?.unreachable) return { kind: "error", url, error: "robots.txt unreachable" };
      return { kind: "robots_disallowed", url };
    }
    const entry = robotsCache.get(parsed.origin);
    try {
      const { res, text } = await rawGet(url, intervalFor(entry));
      return {
        kind: "ok",
        url,
        finalUrl: res.url || url,
        status: res.status,
        text,
        contentType: res.headers.get("content-type") ?? "",
        fetchedAt: new Date(now()),
      };
    } catch (err) {
      return { kind: "error", url, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { fetchPolite, isAllowed };
}
