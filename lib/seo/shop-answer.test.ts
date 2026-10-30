import { describe, expect, it } from "vitest";
import { shopAnswer, shopAnswerJsonLd, shopQuestion } from "./shop-answer";

const base = {
  name: "Houtatelier Noord",
  slug: "houtatelier-noord",
  domain: "houtatelier-noord.nl",
  keurmerk: ["thuiswinkel"],
  keurmerk_status: "verified" as const,
  domain_first_seen: "2009-03-14",
  score: 94,
  score_label: null,
  status: "published" as const,
  store_city: "Groningen",
  has_physical_store: true,
};

describe("shopAnswer", () => {
  it("lists the checked facts in one sentence", () => {
    expect(shopAnswer(base)).toBe(
      "Houtatelier Noord is online sinds 2009, heeft een gecontroleerd keurmerk (Thuiswinkel Waarborg), heeft een fysieke winkel in Groningen en heeft een echtheidsscore van 94 van 100.",
    );
  });
  it("says plainly when a keurmerk is missing or not checked, and hides a score under review", () => {
    expect(shopAnswer({ ...base, keurmerk: [], keurmerk_status: "none", has_physical_store: false, status: "disputed" })).toBe(
      "Houtatelier Noord is online sinds 2009 en heeft geen keurmerk dat we konden vinden.",
    );
    expect(shopAnswer({ ...base, keurmerk_status: "unverified", domain_first_seen: null, has_physical_store: false, score: null })).toBe(
      "Houtatelier Noord noemt een keurmerk op de site (Thuiswinkel Waarborg) dat we nog niet konden controleren.",
    );
  });
  it("never uses opinion words or the words the voice rules forbid", () => {
    const texts = [base, { ...base, keurmerk: [], keurmerk_status: "none" as const, score: 12 }].map((s) => shopAnswer(s));
    for (const t of texts) expect(t).not.toMatch(/review|onbetrouwbaar|veilig|aanrader|\bgoed\b|\bslecht\b/i);
  });
});

describe("shopAnswerJsonLd", () => {
  it("repeats the visible question and answer and carries the check date", () => {
    const ld = shopAnswerJsonLd(base, "2026-10-12") as { dateModified: string; mainEntity: { name: string; acceptedAnswer: { text: string } }[]; about: { url: string } };
    expect(ld.dateModified).toBe("2026-10-12");
    expect(ld.mainEntity[0].name).toBe(shopQuestion(base));
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe(shopAnswer(base));
    expect(ld.about.url).toBe("https://houtatelier-noord.nl");
    expect(JSON.stringify(ld)).not.toMatch(/AggregateRating|"Review"/);
  });
  it("leaves out dateModified without a check", () => {
    expect(shopAnswerJsonLd(base, null)).not.toHaveProperty("dateModified");
  });
});
