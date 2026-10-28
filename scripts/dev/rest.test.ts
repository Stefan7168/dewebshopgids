import { describe, expect, it } from "vitest";
import { buildQuery } from "./rest";

describe("local REST stand-in", () => {
  it("translates the reads lib/ makes", () => {
    const p = new URLSearchParams("select=id,slug&slug=eq.houtatelier-noord&order=score.desc&offset=0&limit=1000");
    expect(buildQuery("shops_public", p)).toEqual({
      text: 'select "id", "slug" from public."shops_public" where "slug"::text = $1 order by "score" desc limit 1000 offset 0',
      values: ["houtatelier-noord"],
    });
  });
  it("serves only the public views and rejects odd identifiers", () => {
    expect(() => buildQuery("shops", new URLSearchParams())).toThrow(/not served/);
    expect(() => buildQuery("shops_public", new URLSearchParams("select=id;drop table x"))).toThrow(/bad identifier/);
    expect(() => buildQuery("shops_public", new URLSearchParams("slug=like.*x"))).toThrow(/not supported/);
  });
});
