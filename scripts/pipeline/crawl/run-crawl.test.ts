import { describe, expect, it } from "vitest";
import { createPoliteFetcher, type FetchImpl } from "../fetch-polite";
import { createFixtureFetch } from "../test-utils/fixture-fetch";
import { crawlShop } from "./crawl-shop";
import { crawlFailed, crawlKind, crawlVerdict } from "./run-crawl";

describe("crawlFailed", () => {
  it("fails over 10% errors once there are at least 3", () => {
    expect(crawlFailed(3, 20)).toBe(true);
    expect(crawlFailed(6, 60)).toBe(false);
    expect(crawlFailed(7, 60)).toBe(true);
  });
  it("does not fail a small night on one or two unreachable sites", () => {
    expect(crawlFailed(1, 4)).toBe(false);
    expect(crawlFailed(2, 3)).toBe(false);
  });
});

/** Crawls each domain with the real polite fetcher and crawlShop, counted the way runCrawl counts. */
async function night(domains: string[], fetchImpl: FetchImpl) {
  const { fetchPolite } = createPoliteFetcher({ fetchImpl, sleep: async () => {}, minIntervalMs: 0 });
  let failed = 0;
  let robots = 0;
  for (const d of domains) {
    const kind = crawlKind(await crawlShop(fetchPolite, d));
    if (kind === "failed") failed++;
    if (kind === "robots") robots++;
  }
  return () => crawlVerdict(domains.length, failed, robots);
}

describe("a night without network (rehearsal 2026-10-29)", () => {
  it("fails the crawl step instead of reporting ok", async () => {
    const calls: string[] = [];
    const verdict = await night(["a.nl", "b.nl", "c.nl", "d.nl", "e.nl"], async (url) => {
      calls.push(url);
      throw new TypeError("fetch failed");
    });
    expect(verdict).toThrow(/5 failed, 0 blocked by robots\.txt: over 10% errors/);
    // Every shop was attempted: the failure comes from the network, not from skipping work.
    expect(calls).toHaveLength(5);
  });

  it("fails when every robots.txt answers 5xx", async () => {
    const verdict = await night(["a.nl", "b.nl", "c.nl"], async () => new Response("down", { status: 503 }));
    expect(verdict).toThrow(/over 10% errors/);
  });

  it("stays ok when the shops are reachable", async () => {
    const f = createFixtureFetch();
    const verdict = await night(["houtatelier.test", "makerij.test", "lampenhuis.test"], f.fetchImpl);
    expect(verdict()).toEqual({ summary: "crawled 3 shops, 0 failed, 0 blocked by robots.txt" });
    expect(f.requests.length).toBeGreaterThan(3);
  });
});
