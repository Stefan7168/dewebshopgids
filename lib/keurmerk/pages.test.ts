import { describe, expect, it } from "vitest";
import type { PublicShop } from "../shops/present";
import { KEURMERK_NAMES, MIN_SHOPS_TO_INDEX } from "../shops/present";
import { KEURMERK_PAGES, indexableKeurmerkPages, keurmerkPageBySlug, keurmerkShops } from "./pages";

function shop(i: number, over: Partial<PublicShop> = {}): PublicShop {
  return {
    id: `s${i}`, slug: `s${i}`, name: `Shop ${String(i).padStart(2, "0")}`, domain: `s${i}.nl`, category_id: "m", platform: null,
    product_count_est: 100, domain_first_seen: null, keurmerk: ["thuiswinkel"], keurmerk_status: "verified", affiliate_available: i % 2 === 0,
    price_level: null, has_physical_store: null, store_city: null, ships_from_country: null, score: 50 + i, score_version: "v1",
    score_label: null, description_nl: null, verified_badge_until: null, updated_at: "2026-10-28", ...over,
  } as PublicShop;
}

describe("/keurmerk/ pages", () => {
  it("has a page for every named keurmerk except 'other'", () => {
    expect(KEURMERK_PAGES.map((p) => p.key).sort()).toEqual(Object.keys(KEURMERK_NAMES).filter((k) => k !== "other").sort());
    expect(keurmerkPageBySlug("thuiswinkel-waarborg")?.key).toBe("thuiswinkel");
    expect(keurmerkPageBySlug("other")).toBeUndefined();
  });

  it("lists only shops whose keurmerk was checked, ordered by score", () => {
    const page = keurmerkPageBySlug("thuiswinkel-waarborg")!;
    const list = keurmerkShops(page, [
      shop(1),
      shop(9),
      shop(5, { keurmerk_status: "unverified" }),
      shop(7, { keurmerk: ["webwinkelkeur"] }),
    ]);
    expect(list.map((s) => s.id)).toEqual(["s9", "s1"]);
  });

  it("indexes a page only from the category threshold", () => {
    const few = Array.from({ length: MIN_SHOPS_TO_INDEX - 1 }, (_, i) => shop(i));
    expect(indexableKeurmerkPages(few)).toEqual([]);
    expect(indexableKeurmerkPages([...few, shop(50)]).map((p) => p.slug)).toEqual(["thuiswinkel-waarborg"]);
  });
});
