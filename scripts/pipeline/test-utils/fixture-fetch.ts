// Test helpers: a fetch that serves scripts/pipeline/fixtures/<host>/manifest.json,
// and a virtual clock so rate limits are tested without waiting.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { FetchImpl } from "../fetch-polite";

const FIXTURES = join(__dirname, "..", "fixtures");

type Entry = { status: number; file: string | null; contentType?: string };

export function createFixtureFetch() {
  const requests: string[] = [];
  const fetchImpl: FetchImpl = async (url) => {
    requests.push(url);
    const host = new URL(url).hostname;
    const manifestPath = join(FIXTURES, host, "manifest.json");
    if (!existsSync(manifestPath)) throw new Error(`no fixture host for ${url}`);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, Entry>;
    const entry = manifest[url];
    if (!entry) return new Response("not found", { status: 404 });
    const body = entry.file ? readFileSync(join(FIXTURES, host, entry.file)) : "";
    const contentType = entry.contentType ?? (entry.file?.endsWith(".txt") ? "text/plain" : "text/html; charset=utf-8");
    const res = new Response(body, { status: entry.status, headers: { "content-type": contentType } });
    Object.defineProperty(res, "url", { value: url });
    return res;
  };
  return { fetchImpl, requests };
}

export function createVirtualClock(start = Date.UTC(2026, 9, 28)) {
  let t = start;
  const waits: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      waits.push(ms);
      t += ms;
    },
    advance: (ms: number) => {
      t += ms;
    },
    waits,
  };
}
