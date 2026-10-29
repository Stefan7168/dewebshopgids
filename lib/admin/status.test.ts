import { describe, expect, it } from "vitest";
import { lastNight, launchBlockers } from "./status";

const ok = (bs: ReturnType<typeof launchBlockers>) => Object.fromEntries(bs.map((b) => [b.key, b.ok]));

describe("launchBlockers", () => {
  it("shows everything open on an empty setup, without values", () => {
    const bs = launchBlockers({ env: { SUPABASE_SERVICE_ROLE_KEY: "secret-value" }, pipelineRuns: [], emailsSent: 0, prenoticeOn: false });
    expect(ok(bs)).toEqual({ service: true, pipeline: false, anthropic: false, domain: false, resend: false, prenotice: false, stripe: false });
    expect(JSON.stringify(bs)).not.toContain("secret-value");
  });

  it("goes green from database evidence and env presence", () => {
    const bs = launchBlockers({
      env: {
        SUPABASE_SERVICE_ROLE_KEY: "x",
        VERCEL_PROJECT_PRODUCTION_URL: "www.dewebshopgids.nl",
        STRIPE_SECRET_KEY: "x",
        STRIPE_PRICE_BADGE_MONTH: "x",
        STRIPE_PRICE_BADGE_YEAR: "x",
        STRIPE_WEBHOOK_SECRET: "x",
      },
      pipelineRuns: [{ agent: "score-collect", status: "ok", started_at: "2026-10-30T01:00:00Z" }],
      emailsSent: 3,
      prenoticeOn: true,
    });
    expect(Object.values(ok(bs)).every(Boolean)).toBe(true);
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
