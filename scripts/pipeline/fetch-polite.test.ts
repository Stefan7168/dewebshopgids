import { describe, expect, it } from "vitest";
import { createPoliteFetcher, USER_AGENT } from "./fetch-polite";
import { createFixtureFetch, createVirtualClock } from "./test-utils/fixture-fetch";

function setup() {
  const f = createFixtureFetch();
  const clock = createVirtualClock();
  const polite = createPoliteFetcher({ fetchImpl: f.fetchImpl, now: clock.now, sleep: clock.sleep });
  return { ...f, clock, polite };
}

describe("fetchPolite on 3 fixture shops (no network)", () => {
  it("fetches allowed pages and reads robots.txt first", async () => {
    const { polite, requests } = setup();
    const res = await polite.fetchPolite("https://houtatelier.test/");
    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      expect(res.status).toBe(200);
      expect(res.text).toContain("eigen atelier");
    }
    expect(requests).toEqual(["https://houtatelier.test/robots.txt", "https://houtatelier.test/"]);
  });

  it("respects Disallow for our user agent", async () => {
    const { polite, requests } = setup();
    const res = await polite.fetchPolite("https://houtatelier.test/checkout");
    expect(res.kind).toBe("robots_disallowed");
    expect(requests).not.toContain("https://houtatelier.test/checkout");
  });

  it("uses our specific group, not the * group", async () => {
    const { polite } = setup();
    // /account is only disallowed for *, not for DeWebshopgidsBot
    expect(await polite.isAllowed("https://houtatelier.test/account")).toBe(true);
  });

  it("treats a 404 robots.txt as allow all", async () => {
    const { polite } = setup();
    const res = await polite.fetchPolite("https://lampenhuis.test/collecties/hanglampen");
    expect(res.kind).toBe("ok");
  });

  it("treats a 5xx robots.txt as disallow all, reported as an error", async () => {
    const { polite, requests } = setup();
    const res = await polite.fetchPolite("https://stoerwonen.test/");
    expect(res).toMatchObject({ kind: "error", error: "robots.txt unreachable" });
    expect(requests).toEqual(["https://stoerwonen.test/robots.txt"]);
  });

  it("treats an unreachable robots.txt as an error, not as the shop's choice", async () => {
    const requests: string[] = [];
    const polite = createPoliteFetcher({
      fetchImpl: async (url: string) => {
        requests.push(url);
        throw new TypeError("fetch failed");
      },
      sleep: async () => {},
    });
    const res = await polite.fetchPolite("https://offline.test/");
    expect(res).toMatchObject({ kind: "error", error: "robots.txt unreachable" });
    expect(requests).toEqual(["https://offline.test/robots.txt"]);
  });

  it("waits at least 3 s between requests to the same domain", async () => {
    const { polite, clock } = setup();
    await polite.fetchPolite("https://lampenhuis.test/");
    await polite.fetchPolite("https://lampenhuis.test/collecties/hanglampen");
    // robots -> home: 3 s, home -> collection: 3 s
    expect(clock.waits).toEqual([3000, 3000]);
  });

  it("honours a longer Crawl-delay", async () => {
    const { polite, clock } = setup();
    await polite.fetchPolite("https://houtatelier.test/");
    await polite.fetchPolite("https://houtatelier.test/over-ons");
    expect(clock.waits).toEqual([5000, 5000]);
  });

  it("does not wait between different domains", async () => {
    const { polite, clock } = setup();
    await polite.fetchPolite("https://lampenhuis.test/");
    clock.advance(60_000); // lampenhuis is idle now
    await polite.fetchPolite("https://houtatelier.test/");
    // Only the robots -> page gap on houtatelier itself (Crawl-delay 5 s); nothing for switching domains.
    expect(clock.waits).toEqual([3000, 5000]);
  });

  it("sends the named user agent", async () => {
    let seen = "";
    const polite = createPoliteFetcher({
      fetchImpl: async (_url, init) => {
        seen = init.headers["User-Agent"];
        return new Response("", { status: 404 });
      },
      sleep: async () => {},
    });
    await polite.fetchPolite("https://x.test/");
    expect(seen).toBe(USER_AGENT);
    expect(USER_AGENT).toMatch(/@/);
  });

  it("aborts after the timeout", async () => {
    const polite = createPoliteFetcher({
      timeoutMs: 20,
      sleep: async () => {},
      fetchImpl: (url, init) =>
        url.endsWith("/robots.txt")
          ? Promise.resolve(new Response("", { status: 404 }))
          : new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted")))),
    });
    const res = await polite.fetchPolite("https://slow.test/");
    expect(res).toMatchObject({ kind: "error", error: "aborted" });
  });

  it("caps the body size", async () => {
    const polite = createPoliteFetcher({
      maxBytes: 10,
      sleep: async () => {},
      fetchImpl: async (url) =>
        new Response(url.endsWith("/robots.txt") ? "" : "x".repeat(100), { status: url.endsWith("/robots.txt") ? 404 : 200 }),
    });
    const res = await polite.fetchPolite("https://big.test/");
    expect(res.kind === "ok" && res.text.length).toBeLessThanOrEqual(10);
  });

  it("rejects non-http urls", async () => {
    const { polite } = setup();
    expect((await polite.fetchPolite("file:///etc/passwd")).kind).toBe("error");
  });
});
