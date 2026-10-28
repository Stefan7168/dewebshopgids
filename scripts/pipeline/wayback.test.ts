import { describe, expect, it } from "vitest";
import { createWaybackClient, WaybackRateLimited } from "./wayback";
import { createVirtualClock } from "./test-utils/fixture-fetch";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("wayback client", () => {
  it("returns the first capture date", async () => {
    const clock = createVirtualClock();
    const wb = createWaybackClient({ now: clock.now, sleep: clock.sleep, fetchImpl: async () => json([["timestamp"], ["20090412083000"]]) });
    expect((await wb.firstCapture("houtatelier.nl"))?.toISOString().slice(0, 10)).toBe("2009-04-12");
  });

  it("returns null when there is no capture", async () => {
    const wb = createWaybackClient({ sleep: async () => {}, fetchImpl: async () => json([]) });
    expect(await wb.firstCapture("nieuw.nl")).toBeNull();
  });

  it("waits 10 s between requests", async () => {
    const clock = createVirtualClock();
    const wb = createWaybackClient({ now: clock.now, sleep: clock.sleep, fetchImpl: async () => json([]) });
    await wb.firstCapture("a.nl");
    await wb.firstCapture("b.nl");
    expect(clock.waits).toEqual([10_000]);
  });

  it("throws WaybackRateLimited on 429", async () => {
    const wb = createWaybackClient({ sleep: async () => {}, fetchImpl: async () => new Response("", { status: 429 }) });
    await expect(wb.firstCapture("a.nl")).rejects.toBeInstanceOf(WaybackRateLimited);
  });

  it("backs off on 5xx and then succeeds", async () => {
    const clock = createVirtualClock();
    let calls = 0;
    const wb = createWaybackClient({
      now: clock.now,
      sleep: clock.sleep,
      fetchImpl: async () => (++calls < 3 ? new Response("", { status: 503 }) : json([["timestamp"], ["20150101000000"]])),
    });
    expect((await wb.firstCapture("a.nl"))?.getUTCFullYear()).toBe(2015);
    expect(clock.waits).toEqual([10_000, 20_000]);
  });

  it("gives up after max retries", async () => {
    const wb = createWaybackClient({ sleep: async () => {}, maxRetries: 2, fetchImpl: async () => new Response("", { status: 500 }) });
    await expect(wb.firstCapture("a.nl")).rejects.toThrow(/after 3 attempts/);
  });
});
