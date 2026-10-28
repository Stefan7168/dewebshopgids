import { describe, expect, it } from "vitest";
import type { Sql } from "../../agents/shared/audit";
import { runRetention } from "./retention";

describe("runRetention", () => {
  it("deletes old crawl text and erases old dispute data", async () => {
    const queries: string[] = [];
    const sql = ((strings: TemplateStringsArray) => {
      queries.push(strings.join("?"));
      return Promise.resolve(queries.length === 1 ? [{ id: 1 }, { id: 2 }] : [{ id: "d" }]);
    }) as unknown as Sql;
    const r = await runRetention(sql);
    expect(r.summary).toBe("deleted 2 page text(s) older than 90 days; erased address and message of 1 old dispute(s)");
    expect(queries[0]).toContain("delete from public.crawl_pages");
    expect(queries[1]).toContain("status = 'resolved'");
  });
});
