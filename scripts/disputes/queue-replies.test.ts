import { describe, expect, it } from "vitest";
import type { Sql } from "../../agents/shared/audit";
import { queueReplies } from "./queue-replies";

function fakeSql(rows: unknown[]) {
  const writes: { query: string; values: unknown[] }[] = [];
  let first = true;
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    if (first) {
      first = false;
      return Promise.resolve(rows);
    }
    writes.push({ query: strings.join("?"), values });
    return Promise.resolve([]);
  }) as unknown as Sql & { json: (v: unknown) => unknown };
  (sql as unknown as { json: (v: unknown) => unknown }).json = (v) => v;
  return { sql, writes };
}

describe("queueReplies", () => {
  it("queues a valid reply with the shop name from the database", async () => {
    const { sql, writes } = fakeSql([{ id: "d1", reply_template_id: "dispute_no_change", reply_slots: { checked_facts: ["keurmerk"] }, shop_name: "Mooi Huis", shop_slug: "mooi-huis" }]);
    const r = await queueReplies(sql);
    expect(r.summary).toBe("queued 1 reply");
    expect(writes).toHaveLength(1);
    expect(writes[0].values).toEqual(["dispute:d1", "dispute_no_change", { reply: { checked_facts: ["keurmerk"] }, shop_name: "Mooi Huis", shop_slug: "mooi-huis" }]);
  });

  it("never sends a template that claims a change only a person makes", async () => {
    const { sql, writes } = fakeSql([{ id: "d3", reply_template_id: "dispute_hidden", reply_slots: {}, shop_name: "X", shop_slug: "x" }]);
    const r = await queueReplies(sql);
    expect(r.summary).toContain("rejected and sent to a person: d3");
    expect(writes.some((w) => w.query.includes("email_queue"))).toBe(false);
  });

  it("sends an invalid reply to a person instead of the shop", async () => {
    const { sql, writes } = fakeSql([{ id: "d2", reply_template_id: "dispute_no_change", reply_slots: { checked_facts: ["marketplace_pattern"] }, shop_name: "X", shop_slug: "x" }]);
    const r = await queueReplies(sql);
    expect(r.summary).toContain("rejected and sent to a person: d2");
    expect(writes.some((w) => w.query.includes("awaiting_human"))).toBe(true);
    expect(writes.some((w) => w.query.includes("agent_escalations"))).toBe(true);
    expect(writes.some((w) => w.query.includes("email_queue"))).toBe(false);
  });
});
