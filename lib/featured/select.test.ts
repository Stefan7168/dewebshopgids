import { describe, expect, it } from "vitest";
import type { Category, PublicShop } from "../shops/present";
import { featuredFor } from "./select";

const meubels: Category = { id: "m", slug: "meubels", name_nl: "Meubels", parent_id: "w", intro_nl: null, seo_title: null, sort_order: 1 };
const shop = (id: string, over: Partial<PublicShop> = {}) =>
  ({ id, slug: id, name: id, category_id: "m", score: 80, score_label: null, ...over }) as PublicShop;
const live = (id: string) => ({ shop_id: id, active_until: "2026-12-01" });

describe("featuredFor", () => {
  it("shows at most two paid shops of this sub-category, alphabetically", () => {
    const shops = [shop("c"), shop("a"), shop("b"), shop("x", { category_id: "v" })];
    const got = featuredFor(meubels, shops, ["a", "b", "c", "x"].map(live));
    expect(got.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("drops ended placements, unpublished shops and scores under 70", () => {
    const shops = [shop("low", { score: 69 }), shop("label", { score: 90, score_label: "audit_required" }), shop("ok")];
    const placements = [live("low"), live("label"), live("gone"), { shop_id: "ok", active_until: null }];
    expect(featuredFor(meubels, shops, placements)).toEqual([]);
    expect(featuredFor(meubels, shops, [live("ok")]).map((s) => s.id)).toEqual(["ok"]);
  });
});
