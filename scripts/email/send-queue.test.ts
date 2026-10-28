import { describe, expect, it } from "vitest";
import type { Sql } from "../../agents/shared/audit";
import { TEMPLATES } from "../../lib/email/templates";
import { sendQueue, type SendEmail } from "./send-queue";

/** Tagged-template stand-in for postgres.js: the first query returns `rows`, later ones record updates. */
function fakeSql(rows: unknown[]) {
  const updates: unknown[][] = [];
  let first = true;
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    if (first) {
      first = false;
      return Promise.resolve(rows);
    }
    updates.push([strings.join("?"), ...values]);
    return Promise.resolve([]);
  }) as unknown as Sql;
  return { sql, updates };
}

describe("templates", () => {
  it("renders owner alerts in Dutch and refuses missing slots", () => {
    const t = TEMPLATES.ops_pause_alert;
    if (t.recipient === "internal") throw new Error("unexpected");
    const r = t.render({ agent: "shop-scout", reason: "3 failed runs", paused_until: "2026-10-30T05:30:00Z" });
    expect(r?.subject).toBe("Ops Watchdog heeft shop-scout gepauzeerd");
    expect(r?.text).toContain("06:30"); // 24-hour Amsterdam time (CET after 25 October 2026)
    expect(t.render({})).toBeNull();
    expect(TEMPLATES.digest_summary.recipient).toBe("internal");
  });
});

describe("sendQueue", () => {
  it("sends owner mail with the row id as idempotency key, marks it sent, and skips what it cannot address", async () => {
    const { sql, updates } = fakeSql([
      { id: "a", to: "owner", shop_id: null, template: "ops_gap_alert", slots: { agent: "crawl", last_run: null } },
      { id: "b", to: "someone@evil.test", shop_id: null, template: "ops_gap_alert", slots: { agent: "crawl" } },
      { id: "c", to: "owner", shop_id: null, template: "weekly_digest", slots: { week: "2026-W44" } },
    ]);
    const sent: Parameters<SendEmail>[0][] = [];
    const r = await sendQueue(sql, async (m) => void sent.push(m), "stefan@example.nl");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "stefan@example.nl", idempotencyKey: "email_queue/a" });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toContain("a");
    expect(r.summary).toContain("sent 1 of 3");
    expect(r.summary).toContain("b (ops_gap_alert)");
    expect(r.summary).toContain("c (weekly_digest)");
  });

  it("does not mark a row sent when Resend fails", async () => {
    const { sql, updates } = fakeSql([{ id: "a", to: "owner", shop_id: null, template: "ops_gap_alert", slots: { agent: "crawl" } }]);
    await expect(sendQueue(sql, async () => Promise.reject(new Error("Resend 500")), "o@x.nl")).rejects.toThrow("Resend 500");
    expect(updates).toHaveLength(0);
  });

  it("sends nothing to the owner when OWNER_EMAIL is missing", async () => {
    const { sql } = fakeSql([{ id: "a", to: "owner", shop_id: null, template: "ops_gap_alert", slots: { agent: "crawl" } }]);
    const r = await sendQueue(sql, async () => {
      throw new Error("must not send");
    }, undefined);
    expect(r.summary).toContain("sent 0 of 1");
  });
});
