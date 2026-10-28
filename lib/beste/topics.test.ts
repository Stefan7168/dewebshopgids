import { describe, expect, it } from "vitest";
import type { Category, PublicShop } from "../shops/present";
import { MAX_SHOPS_PER_LIST, MIN_SHOPS_PER_LIST, TOPICS, besteList, liveTopics, topicBySlug } from "./topics";

const cats: Category[] = [
  { id: "w", slug: "wonen", name_nl: "Wonen", parent_id: null, intro_nl: null, seo_title: null, sort_order: 0 },
  { id: "m", slug: "meubels", name_nl: "Meubels", parent_id: "w", intro_nl: null, seo_title: null, sort_order: 1 },
];

function shop(i: number, over: Partial<PublicShop> = {}): PublicShop {
  return {
    id: `s${i}`, slug: `s${i}`, name: `Shop ${String(i).padStart(2, "0")}`, domain: `s${i}.nl`, category_id: "m", platform: null,
    product_count_est: 100, domain_first_seen: null, keurmerk: [], keurmerk_status: "none", affiliate_available: i % 2 === 0,
    price_level: null, has_physical_store: null, store_city: null, ships_from_country: null, score: 50 + i, score_version: "v1",
    score_label: null, description_nl: null, verified_badge_until: null, updated_at: "2026-10-28", ...over,
  } as PublicShop;
}

describe("/beste/ lists", () => {
  it("resolves only webshops-{topic} slugs", () => {
    expect(topicBySlug("webshops-meubels")?.categorySlug).toBe("meubels");
    expect(topicBySlug("meubels")).toBeUndefined();
    expect(topicBySlug("webshops-onbekend")).toBeUndefined();
  });

  it("has no page under 15 numerically scored shops", () => {
    const t = topicBySlug("webshops-meubels")!;
    const shops = Array.from({ length: MIN_SHOPS_PER_LIST - 1 }, (_, i) => shop(i));
    shops.push(shop(99, { score_label: "audit_required" }), shop(98, { score: null }));
    expect(besteList(t, shops, cats)).toBeNull();
    expect(liveTopics(shops, cats)).toEqual([]);
  });

  it("orders by score only, never by affiliate status, and caps the length", () => {
    const t = topicBySlug("webshops-meubels")!;
    const shops = Array.from({ length: 40 }, (_, i) => shop(i));
    const list = besteList(t, shops, cats)!;
    expect(list).toHaveLength(MAX_SHOPS_PER_LIST);
    expect(list[0].score).toBe(89);
    expect(list.every((s, i) => i === 0 || (list[i - 1].score ?? 0) >= (s.score ?? 0))).toBe(true);
  });

  it("keeps the copy neutral", () => {
    for (const t of TOPICS) {
      const text = [t.title, ...t.intro].join(" ");
      expect(text).not.toMatch(/onbetrouwbaar|review|advertentie|\b20\d\d\b/i);
    }
  });
});
