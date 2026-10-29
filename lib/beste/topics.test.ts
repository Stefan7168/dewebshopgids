import { describe, expect, it } from "vitest";
import type { Category, PublicShop } from "../shops/present";
import { wordCount } from "../seo/faq";
import { MAX_SHOPS_PER_LIST, MIN_SHOPS_PER_LIST, TOPICS, besteList, liveTopics, siblingTopics, topicBySlug } from "./topics";

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
      const text = [t.title, ...t.intro, ...t.faq.flatMap((f) => [f.q, f.a])].join(" ");
      expect(text).not.toMatch(/onbetrouwbaar|review|advertentie|\b20\d\d\b/i);
    }
  });

  it("applies a topic's fact filter without changing the order", () => {
    const t = topicBySlug("webshops-met-showroom")!;
    const shops = Array.from({ length: 40 }, (_, i) => shop(i, { has_physical_store: i % 2 === 0 ? true : null }));
    const list = besteList(t, shops, cats)!;
    expect(list).toHaveLength(20);
    expect(list.every((s) => s.has_physical_store === true)).toBe(true);
    expect(list[0].score).toBe(88);
    const few = shops.map((s, i) => ({ ...s, has_physical_store: i < MIN_SHOPS_PER_LIST - 1 }));
    expect(besteList(t, few, cats)).toBeNull();
  });

  it("has a list for every launch sub-category, the garden sub-categories, and unique slugs", () => {
    const slugs = TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of ["meubels", "verlichting", "woontextiel", "woonaccessoires", "keuken-tafelen", "slapen", "tuin-buiten", "tuinmeubels", "potten-plantenbakken", "buitenverlichting", "vuur-bbq", "eten-drinken", "koffie-thee", "chocolade-koek", "kaas-delicatessen"]) {
      expect(TOPICS.some((t) => t.categorySlug === c && !t.only)).toBe(true);
    }
  });

  it("gives every list its own 120 to 200 word intro and 3 to 5 questions", () => {
    const seen = new Set<string>();
    for (const t of TOPICS) {
      expect(t.keyword, t.slug).toBeTruthy();
      const words = wordCount(t.intro);
      expect(words, `${t.slug}: ${words} words`).toBeGreaterThanOrEqual(120);
      expect(words, `${t.slug}: ${words} words`).toBeLessThanOrEqual(200);
      expect(t.faq.length, t.slug).toBeGreaterThanOrEqual(3);
      expect(t.faq.length, t.slug).toBeLessThanOrEqual(5);
      for (const p of t.intro) {
        expect(seen.has(p), `${t.slug} repeats a paragraph`).toBe(false);
        seen.add(p);
      }
    }
  });

  it("links only to other live lists under the same root category", () => {
    const all: Category[] = [...cats, { id: "v", slug: "verlichting", name_nl: "Verlichting", parent_id: "w", intro_nl: null, seo_title: null, sort_order: 2 },
      { id: "e", slug: "eten-drinken", name_nl: "Eten & drinken", parent_id: null, intro_nl: null, seo_title: null, sort_order: 3 }];
    const live = ["webshops-meubels", "webshops-verlichting", "webshops-eten-en-drinken"].map((s) => topicBySlug(s)!);
    const sib = siblingTopics(live[0], live, all).map((t) => t.slug);
    expect(sib).toEqual(["verlichting"]);
  });
});
