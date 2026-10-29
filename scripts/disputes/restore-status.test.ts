import { describe, expect, it } from "vitest";
import { decideRestore, type DisputeState } from "./restore-status";

const now = new Date("2026-11-10T12:00:00Z");
const d = (id: string, status: string, daysAgo = 1, reply_sent = false): DisputeState => ({
  id, status, created_at: new Date(now.getTime() - daysAgo * 86_400_000), reply_sent,
});

describe("decideRestore", () => {
  it("restores after a sent no-change reply and resolves it", () =>
    expect(decideRestore([d("a", "agent_replied", 2, true)], now)).toEqual({ restore: true, resolve: ["a"], expire: [] }));
  it("waits until the reply is sent", () => expect(decideRestore([d("a", "agent_replied", 2, false)], now).restore).toBe(false));
  it.each(["open", "awaiting_human"])("waits while a dispute is %s", (s) =>
    expect(decideRestore([d("a", "agent_replied", 2, true), d("b", s)], now)).toEqual({ restore: false, resolve: [], expire: [] }));
  it("waits for a confirmation link that is still valid", () => expect(decideRestore([d("a", "awaiting_confirmation", 3)], now).restore).toBe(false));
  it("closes an expired confirmation link and then restores", () =>
    expect(decideRestore([d("a", "awaiting_confirmation", 8)], now)).toEqual({ restore: true, resolve: [], expire: ["a"] }));
});
