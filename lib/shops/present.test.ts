import { describe, expect, it } from "vitest";
import { MARKETPLACE_LABEL, MAX_POINTS } from "@/lib/scoring/weights";
import { earnedSubScores, subScoreFor, type SignalRow } from "./evidence-rules";
import { keurmerkText, onlineSince, productCountText, rankingExplanation, rankShops, scoreDisplay, shopsInCategory, type Category } from "./present";

describe("scoreDisplay", () => {
  it("shows the number only when no label is set", () => {
    expect(scoreDisplay({ score: 72, score_label: null })).toEqual({ kind: "number", value: 72 });
    expect(scoreDisplay({ score: 35, score_label: "audit_required" })).toEqual({ kind: "pending" });
    expect(scoreDisplay({ score: 12, score_label: MARKETPLACE_LABEL })).toEqual({ kind: "label", text: MARKETPLACE_LABEL });
    expect(scoreDisplay({ score: null, score_label: null })).toEqual({ kind: "none" });
  });
});

describe("rankShops", () => {
  it("puts numbered shops first by score, then pending, label and unscored, ties by name", () => {
    const shops = [
      { name: "Zeta", score: 60, score_label: null },
      { name: "Label", score: 10, score_label: MARKETPLACE_LABEL },
      { name: "Pending", score: 38, score_label: "audit_required" },
      { name: "Alfa", score: 60, score_label: null },
      { name: "Top", score: 90, score_label: null },
      { name: "None", score: null, score_label: null },
    ];
    expect(rankShops(shops).map((s) => s.name)).toEqual(["Top", "Alfa", "Zeta", "Pending", "Label", "None"]);
  });
});

describe("shopsInCategory", () => {
  const cats: Category[] = [
    { id: "w", slug: "wonen", name_nl: "Wonen", parent_id: null, intro_nl: null, seo_title: null, sort_order: 0 },
    { id: "m", slug: "meubels", name_nl: "Meubels", parent_id: "w", intro_nl: null, seo_title: null, sort_order: 1 },
    { id: "x", slug: "other", name_nl: "Other", parent_id: null, intro_nl: null, seo_title: null, sort_order: 2 },
  ];
  const shops = [{ category_id: "w" }, { category_id: "m" }, { category_id: "x" }, { category_id: null }];
  it("includes direct sub-categories for a parent", () => {
    expect(shopsInCategory(shops, cats[0], cats)).toHaveLength(2);
    expect(shopsInCategory(shops, cats[1], cats)).toEqual([{ category_id: "m" }]);
  });
});

describe("facts", () => {
  it("formats keurmerk, year and product count", () => {
    expect(keurmerkText({ keurmerk: ["thuiswinkel"], keurmerk_status: "verified" })).toContain("gecontroleerd");
    expect(keurmerkText({ keurmerk: ["webwinkelkeur"], keurmerk_status: "unverified" })).toContain("nog niet gecontroleerd");
    expect(keurmerkText({ keurmerk: [], keurmerk_status: "none" })).toBe("Geen keurmerk gevonden");
    expect(onlineSince("2009-04-01")).toBe("2009");
    expect(onlineSince(null)).toBeNull();
    expect(productCountText(12)).toBe("Minder dan 50 producten");
    expect(productCountText(1234)).toBe("Ongeveer 1.200 producten");
  });
});

describe("rankingExplanation", () => {
  it("names every sub-score maximum and says payment has no influence", () => {
    const text = rankingExplanation().join(" ");
    for (const max of Object.values(MAX_POINTS)) expect(text).toContain(`max ${max}`);
    expect(text).toContain("Betaling heeft geen invloed op de volgorde.");
    expect(text).not.toMatch(/onbetrouwbaar|review/i);
  });
});

describe("earnedSubScores", () => {
  const sig = (signal_key: string, quote: string | null, verified = true, value = true): SignalRow => ({
    signal_key,
    value_bool: value,
    evidence_quote: quote,
    evidence_url: "https://shop.nl/over",
    quote_verified: verified,
  });

  it("never maps the negative inferences", () => {
    expect(subScoreFor("marketplace_pattern")).toBeNull();
    expect(subScoreFor("dropship_indicators")).toBeNull();
    expect(subScoreFor("focus_everything")).toBeNull();
    expect(subScoreFor("origin_made_in_nl")).toBe("origin");
  });

  it("shows only earned sub-scores with verified quotes", () => {
    const out = earnedSubScores(
      { maker: 30, focus: 0, identity: 6, scale: 20, origin: 3, valid_signals: 7 },
      MAX_POINTS,
      [
        sig("own_production", "Wij maken alles zelf in onze werkplaats."),
        sig("marketplace_pattern", "Duizenden merken op één plek."),
        sig("focus_broad", "Van lampen tot tuinstoelen."),
        sig("origin_made_in_nl", "Gemaakt in Nederland.", false),
      ],
    );
    expect(out.map((e) => e.key)).toEqual(["maker", "identity", "scale"]);
    expect(out[0].evidence).toEqual([{ quote: "Wij maken alles zelf in onze werkplaats.", url: "https://shop.nl/over" }]);
    expect(JSON.stringify(out)).not.toContain("Duizenden");
  });

  it("drops a quote-based sub-score that has points but no verified quote", () => {
    expect(earnedSubScores({ maker: 20 }, MAX_POINTS, [sig("brand_owner", null)])).toEqual([]);
  });
});

describe("verified badge", () => {
  it("is active through its end date and off without one", async () => {
    const { hasVerifiedBadge } = await import("./present");
    expect(hasVerifiedBadge({ verified_badge_until: "2026-11-30" }, "2026-11-30")).toBe(true);
    expect(hasVerifiedBadge({ verified_badge_until: "2026-11-29" }, "2026-11-30")).toBe(false);
    expect(hasVerifiedBadge({ verified_badge_until: null }, "2026-11-30")).toBe(false);
  });
});
