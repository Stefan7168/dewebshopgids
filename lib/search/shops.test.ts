import { describe, expect, it } from "vitest";
import type { Category, PublicShop } from "../shops/present";
import { normalize, queryTerms, searchShops } from "./shops";

const cats: Category[] = [
  { id: "w", slug: "wonen", name_nl: "Wonen & interieur", parent_id: null, intro_nl: null, seo_title: null, sort_order: 0 },
  { id: "v", slug: "verlichting", name_nl: "Verlichting", parent_id: "w", intro_nl: null, seo_title: null, sort_order: 1 },
  { id: "k", slug: "keuken-tafelen", name_nl: "Keuken & tafelen", parent_id: "w", intro_nl: null, seo_title: null, sort_order: 2 },
];

function shop(id: string, over: Partial<PublicShop>): PublicShop {
  return {
    id, slug: id, name: id, domain: `${id}.nl`, category_id: "v", platform: null, product_count_est: 10, domain_first_seen: null,
    keurmerk: [], keurmerk_status: "none", affiliate_available: false, price_level: null, has_physical_store: null, store_city: null,
    ships_from_country: null, score: 50, score_version: "v1", score_label: null, description_nl: null, verified_badge_until: null,
    updated_at: "2026-10-28", ...over,
  } as PublicShop;
}

const shops = [
  shop("lampen-atelier", { name: "Lampen Atelier", description_nl: "Handgemaakte lampen van keramiek.", score: 80 }),
  shop("licht-co", { name: "Licht & Co", score: 90 }),
  shop("bord-en-co", { name: "Bord en Co", category_id: "k", description_nl: "Servies uit eigen atelier.", score: 70 }),
];

describe("shop search", () => {
  it("normalizes accents, case and punctuation", () => {
    expect(normalize("  Café-Crème!  ")).toBe("cafe creme");
    expect(queryTerms("a de LAMP lamp")).toEqual(["de", "lamp"]);
    expect(queryTerms("x".repeat(200))[0]).toHaveLength(80);
  });

  it("needs every term, searching name, description and category names", () => {
    expect(searchShops("atelier", shops, cats).map((s) => s.id)).toEqual(["lampen-atelier", "bord-en-co"]);
    expect(searchShops("atelier keramiek", shops, cats).map((s) => s.id)).toEqual(["lampen-atelier"]);
    expect(searchShops("verlichting", shops, cats).map((s) => s.id)).toEqual(["licht-co", "lampen-atelier"]);
    expect(searchShops("interieur", shops, cats)).toHaveLength(3);
  });

  it("returns nothing for an empty or too short query", () => {
    expect(searchShops("", shops, cats)).toEqual([]);
    expect(searchShops("a", shops, cats)).toEqual([]);
  });
});
