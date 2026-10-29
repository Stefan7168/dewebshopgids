import { describe, expect, it } from "vitest";
import type { Sql } from "../../agents/shared/audit";
import { runPopularity } from "./popularity";

describe("runPopularity", () => {
  it("replaces all ranks in one transaction from recent non-bot clicks of published shops", async () => {
    const queries: string[] = [];
    const tx = ((strings: TemplateStringsArray) => {
      queries.push(strings.join("?"));
      return Promise.resolve(queries.length === 1 ? [] : [{ shop_id: "a" }, { shop_id: "b" }]);
    }) as unknown as Sql;
    const sql = { begin: (fn: (t: Sql) => Promise<unknown>) => fn(tx) } as unknown as Sql;
    const r = await runPopularity(sql);
    expect(r.summary).toBe("ranked 2 shop(s) with 3+ clicks in 30 days");
    expect(queries[0]).toContain("delete from public.shop_popularity");
    expect(queries[1]).toContain("s.status = 'published'");
    expect(queries[1]).toContain("<> 'bot'");
  });
});
