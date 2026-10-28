import { describe, expect, it } from "vitest";
import { pickGuideShops, type GuideCandidate } from "./inputs";

const base: Omit<GuideCandidate, "id" | "slug" | "name"> = {
  category: "Meubels", score: 60, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: "2015",
  products: null, city: null, description: null, first_published_at: null, score_before: null, clicks: 0, featured_before: false,
};
const shop = (name: string, extra: Partial<GuideCandidate> = {}): GuideCandidate => ({ ...base, id: name, slug: name, name, ...extra });
const start = new Date("2026-10-26T00:00:00Z");
const end = new Date("2026-11-02T00:00:00Z");

describe("pickGuideShops", () => {
  it("orders new, then score rise, then clicks, max 5, no duplicates", () => {
    const r = pickGuideShops([
      shop("a", { first_published_at: "2026-10-27T10:00:00Z", score: 70 }),
      shop("b", { first_published_at: "2026-10-28T10:00:00Z", score: 80, score_before: 60 }),
      shop("c", { score: 75, score_before: 60 }),
      shop("d", { score: 62, score_before: 61 }),
      shop("e", { clicks: 30 }),
      shop("f", { clicks: 50, featured_before: true }),
      shop("g", { clicks: 10 }),
      shop("h", { clicks: 5 }),
    ], start, end);
    expect(r.map((s) => [s.id, s.reason])).toEqual([["b", "nieuw"], ["a", "nieuw"], ["c", "score_gestegen"], ["d", "score_gestegen"], ["e", "veel_bekeken"]]);
    expect(r[0].score_change).toBe(20);
  });

  it("skips shops without a visible number and outside the window", () => {
    const r = pickGuideShops([
      shop("x", { first_published_at: "2026-11-02T00:00:00Z" }),
      shop("y", { first_published_at: "2026-10-27T00:00:00Z", score_label: "audit_required" }),
      shop("z", { score: null, clicks: 9 }),
    ], start, end);
    expect(r).toEqual([]);
  });
});
