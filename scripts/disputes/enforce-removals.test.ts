import { describe, expect, it } from "vitest";
import type { Sql } from "../../agents/shared/audit";
import { enforceRemovals } from "./enforce-removals";

function fakeSql(rows: unknown[]) {
  const updates: string[] = [];
  let first = true;
  const sql = ((strings: TemplateStringsArray) => {
    if (first) {
      first = false;
      return Promise.resolve(rows);
    }
    updates.push(strings.join("?"));
    return Promise.resolve([]);
  }) as unknown as Sql;
  return { sql, updates };
}

describe("enforceRemovals", () => {
  it("removes each confirmed shop and resolves its dispute", async () => {
    const { sql, updates } = fakeSql([
      { dispute_id: "d1", shop_id: "s1", slug: "mooi" },
      { dispute_id: "d2", shop_id: "s1", slug: "mooi" },
    ]);
    const r = await enforceRemovals(sql);
    expect(r.slugs).toEqual(["mooi"]);
    expect(updates.filter((u) => u.includes("set status = 'removed'"))).toHaveLength(2);
    expect(updates.filter((u) => u.includes("status = 'resolved'"))).toHaveLength(2);
  });

  it("does nothing when everything is done", async () => {
    const { sql, updates } = fakeSql([]);
    expect((await enforceRemovals(sql)).summary).toBe("nothing to remove");
    expect(updates).toHaveLength(0);
  });
});
