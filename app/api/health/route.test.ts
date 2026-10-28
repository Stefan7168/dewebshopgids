import { beforeEach, describe, expect, it, vi } from "vitest";

let rows: Record<string, Record<string, string>[]> = {};
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), connection: async () => {} }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      const q = { select: () => q, order: () => q, limit: async () => ({ data: rows[table] ?? [], error: null }) };
      return q;
    },
  }),
}));
const { GET } = await import("./route");

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

beforeEach(() => {
  rows = {
    score_runs: [{ started_at: hoursAgo(20), status: "ok" }],
    agent_runs: [{ started_at: hoursAgo(1), status: "ok" }],
    health_checks: [{ checked_at: hoursAgo(20), status: "ok" }],
  };
});

describe("GET /api/health", () => {
  it("is 200 when every source is fresh", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).stale).toEqual([]);
  });

  it("is 503 and names the stale source after 48 hours", async () => {
    rows.score_runs = [{ started_at: hoursAgo(49), status: "ok" }];
    rows.health_checks = [];
    const res = await GET();
    expect(res.status).toBe(503);
    expect((await res.json()).stale).toEqual(["score_runs", "health_checks"]);
  });
});
