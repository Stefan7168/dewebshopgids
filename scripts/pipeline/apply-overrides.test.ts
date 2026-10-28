import { describe, expect, it } from "vitest";
import type { Sql } from "../../agents/shared/audit";
import { applyOverrides, changedColumns, stable } from "./apply-overrides";

describe("changedColumns", () => {
  it("compares jsonb regardless of key order and skips equal columns", () => {
    expect(stable({ b: 1, a: [1, { d: 2, c: 3 }] })).toBe(stable({ a: [1, { c: 3, d: 2 }], b: 1 }));
    const current = { domain_first_seen: "2015-01-01", domain_age_sources: { year: 2015, agree: true, manual: true }, price_level: 2 };
    const wanted = { domain_first_seen: "2015-01-01", domain_age_sources: { manual: true, year: 2015, agree: true }, price_level: 3 };
    expect(changedColumns(current, wanted)).toEqual(["price_level"]);
  });
});

describe("applyOverrides", () => {
  it("skips cleanly while migration 0011 is not applied", async () => {
    const sql = ((strings: TemplateStringsArray) => {
      expect(strings.join("?")).toContain("to_regclass('public.fact_overrides')");
      return Promise.resolve([{ ready: false }]);
    }) as unknown as Sql;
    expect(await applyOverrides(sql)).toEqual({ summary: "skipped: migration 0011 not applied yet" });
  });
});
