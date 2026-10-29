import { describe, expect, it } from "vitest";
import { lastNight, launchBlockers, latestPerAgent } from "./status";

const ok = (bs: ReturnType<typeof launchBlockers>) => Object.fromEntries(bs.map((b) => [b.key, b.ok]));

describe("launchBlockers", () => {
  it("shows everything open on an empty setup, without values", () => {
    const bs = launchBlockers({ env: { SUPABASE_SERVICE_ROLE_KEY: "secret-value" }, pipelineRuns: [], batchesSubmitted: 0, emailsSent: 0, prenoticeOn: false });
    expect(ok(bs)).toEqual({ service: true, pipeline: false, anthropic: false, domain: false, resend: false, prenotice: false, stripe: false });
    expect(JSON.stringify(bs)).not.toContain("secret-value");
  });

  it("goes green from database evidence and env presence", () => {
    const bs = launchBlockers({
      env: {
        SUPABASE_SERVICE_ROLE_KEY: "x",
        VERCEL_PROJECT_PRODUCTION_URL: "www.dewebshopgids.nl",
        STRIPE_SECRET_KEY: "sk_test_x",
        STRIPE_PRICE_BADGE_MONTH: "price_m",
        STRIPE_PRICE_BADGE_YEAR: "price_y",
        STRIPE_WEBHOOK_SECRET: "whsec_x",
      },
      pipelineRuns: [{ agent: "score-collect", status: "ok", started_at: "2026-10-30T01:00:00Z" }],
      batchesSubmitted: 1,
      emailsSent: 3,
      prenoticeOn: true,
    });
    expect(Object.values(ok(bs)).every(Boolean)).toBe(true);
  });
});

describe("launchBlockers edge cases", () => {
  const base = { env: {}, pipelineRuns: [{ agent: "score-collect", status: "ok", started_at: "2026-10-30T01:00:00Z" }], emailsSent: 0, prenoticeOn: false };
  it("does not call the Anthropic key working from an empty collect step", () => {
    expect(ok(launchBlockers({ ...base, batchesSubmitted: 0 })).anthropic).toBe(false);
  });
  it("keeps Stripe red when an id has the wrong format, as checkout does", () => {
    const env = { STRIPE_SECRET_KEY: "sk_live_x", STRIPE_PRICE_BADGE_MONTH: "price_m", STRIPE_PRICE_BADGE_YEAR: "prod_y", STRIPE_WEBHOOK_SECRET: "whsec_x" };
    expect(ok(launchBlockers({ ...base, env, batchesSubmitted: 0 })).stripe).toBe(false);
  });
});

describe("lastNight", () => {
  it("keeps only the newest night's steps, oldest first", () => {
    const runs = [
      { agent: "crawl", started_at: "2026-10-30T01:10:00Z" },
      { agent: "promote-candidates", started_at: "2026-10-30T01:00:00Z" },
      { agent: "crawl", started_at: "2026-10-29T01:10:00Z" },
    ];
    expect(lastNight(runs).map((r) => r.agent)).toEqual(["promote-candidates", "crawl"]);
    expect(lastNight([])).toEqual([]);
  });
});

describe("latestPerAgent", () => {
  it("takes the newest row per agent and marks agents without rows as never run", () => {
    const rows = [
      { agent: "ops-watchdog", status: "ok", started_at: "2026-10-29T06:00:00Z" },
      { agent: "score-auditor", status: "error", started_at: "2026-10-29T05:00:00Z" },
      { agent: "ops-watchdog", status: "error", started_at: "2026-10-28T06:00:00Z" },
    ];
    expect(latestPerAgent(["ops-watchdog", "score-auditor", "shop-scout"], rows)).toEqual([
      { agent: "ops-watchdog", status: "ok", started_at: "2026-10-29T06:00:00Z" },
      { agent: "score-auditor", status: "error", started_at: "2026-10-29T05:00:00Z" },
      { agent: "shop-scout", status: null, started_at: null },
    ]);
  });
});
