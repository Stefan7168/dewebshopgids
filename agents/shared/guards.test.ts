import { describe, expect, it } from "vitest";
import { decideBudget, decideKillSwitch } from "./guards";

const now = new Date("2026-10-28T12:00:00Z");
const on = { agents_enabled: true };

describe("decideKillSwitch", () => {
  it("allows when enabled and not paused", () => {
    expect(decideKillSwitch(on, "shop-scout", now)).toEqual({ ok: true });
  });
  it("stops when the global flag is false or missing", () => {
    expect(decideKillSwitch({ agents_enabled: false }, "a", now).ok).toBe(false);
    expect(decideKillSwitch({}, "a", now).ok).toBe(false);
  });
  it("stops when AGENTS_PAUSED is true", () => {
    expect(decideKillSwitch(on, "a", now, "true").ok).toBe(false);
    expect(decideKillSwitch(on, "a", now, "false").ok).toBe(true);
  });
  it("stops a single disabled agent", () => {
    expect(decideKillSwitch({ ...on, "enabled.a": false }, "a", now).ok).toBe(false);
    expect(decideKillSwitch({ ...on, "enabled.a": false }, "b", now).ok).toBe(true);
  });
  it("respects paused_until in the future and ignores it in the past", () => {
    expect(decideKillSwitch({ ...on, "paused_until.a": "2026-10-29T00:00:00Z" }, "a", now).ok).toBe(false);
    expect(decideKillSwitch({ ...on, "paused_until.a": "2026-10-27T00:00:00Z" }, "a", now).ok).toBe(true);
  });
  it("treats an unparseable paused_until as paused", () => {
    expect(decideKillSwitch({ ...on, "paused_until.a": "soon" }, "a", now).ok).toBe(false);
  });
});

describe("decideBudget", () => {
  it("allows under budget", () => {
    expect(decideBudget({ monthly_budget_usd: 150, month_spend_usd: 10 }).ok).toBe(true);
  });
  it("stops at or over budget, or without a budget", () => {
    expect(decideBudget({ monthly_budget_usd: 150, month_spend_usd: 150 }).ok).toBe(false);
    expect(decideBudget({ month_spend_usd: 1 }).ok).toBe(false);
  });
});
