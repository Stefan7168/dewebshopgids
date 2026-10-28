import { describe, expect, it, vi } from "vitest";
import { dispatchKillSwitch, formatTime, isAgentName, pausedAgents, scheduleGaps } from "./ops";

describe("pausedAgents", () => {
  it("lists disabled agents with their pause end, ignoring enabled ones and bad names", () => {
    expect(
      pausedAgents([
        { key: "enabled.shop-scout", value: false },
        { key: "paused_until.shop-scout", value: "2026-10-30T05:00:00Z" },
        { key: "enabled.score-auditor", value: true },
        { key: "enabled.dispute-handler", value: false },
        { key: "enabled.Bad Name", value: false },
        { key: "agents_enabled", value: false },
      ]),
    ).toEqual([
      { agent: "dispute-handler", until: null },
      { agent: "shop-scout", until: "2026-10-30T05:00:00Z" },
    ]);
  });
});

describe("scheduleGaps", () => {
  it("marks never-run and overdue agents late, late ones first", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    const s = (agent: string, max: number) => ({ agent, cron: "0 * * * *", timezone: "UTC", max_gap_minutes: max });
    const rows = scheduleGaps(
      [s("a-ok", 120), s("b-late", 60), s("c-never", 60)],
      new Map([
        ["a-ok", "2026-10-28T11:00:00Z"],
        ["b-late", "2026-10-28T10:00:00Z"],
      ]),
      now,
    );
    expect(rows.map((r) => [r.agent, r.late])).toEqual([
      ["b-late", true],
      ["c-never", true],
      ["a-ok", false],
    ]);
  });
});

describe("dispatchKillSwitch", () => {
  it("explains the manual route without a token", async () => {
    const r = await dispatchKillSwitch(undefined, "o/r");
    expect(r.ok).toBe(false);
    expect(r.note).toContain("GITHUB_DISPATCH_TOKEN");
  });
  it("posts a workflow dispatch on main", async () => {
    const get = vi.fn(async () => new Response(null, { status: 204 }));
    const r = await dispatchKillSwitch("t", "o/r", get as unknown as typeof fetch);
    expect(r.ok).toBe(true);
    const [url, init] = get.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/o/r/actions/workflows/kill-switch.yml/dispatches");
    expect(JSON.parse(String(init.body))).toEqual({ ref: "main" });
  });
});

describe("helpers", () => {
  it("validates agent names and formats time on a 24-hour clock", () => {
    expect(isAgentName("ops-watchdog")).toBe(true);
    expect(isAgentName("x'; drop")).toBe(false);
    expect(formatTime("2026-10-28T17:30:00Z")).toContain("18:30");
    expect(formatTime(null)).toBe("nooit");
  });
});
