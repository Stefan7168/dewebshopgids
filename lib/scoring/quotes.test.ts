import { describe, expect, it } from "vitest";
import { bestSubstringDistance, matchRate, normalizeText, redactPersonalData, verifyQuote } from "./quotes";

const page = `Over ons\n\nIn ons atelier in Zwolle maken wij elke tafel met de hand. Alle
meubels worden op maat gemaakt van “eerlijk” eikenhout uit Europa. Ver­zending
binnen Nederland is gratis.`;

describe("normalizeText", () => {
  it("applies NFKC, quote variants, soft hyphens and whitespace", () => {
    expect(normalizeText("ﬁne “quote” ‘x’ Ver­zending\n\t a")).toBe(
      `fine "quote" 'x' verzending a`,
    );
  });
});

describe("bestSubstringDistance", () => {
  it("is 0 for a substring and counts edits otherwise", () => {
    expect(bestSubstringDistance("tafel", "een tafel hier")).toBe(0);
    expect(bestSubstringDistance("tafel", "een tefel hier")).toBe(1);
    expect(bestSubstringDistance("abc", "")).toBe(3);
  });
});

describe("verifyQuote", () => {
  it("accepts an exact quote across line breaks and typographic quotes", () => {
    expect(verifyQuote('worden op maat gemaakt van "eerlijk" eikenhout', page)).toEqual({ verified: true, ratio: 1 });
    expect(verifyQuote("Verzending binnen Nederland is gratis.", page).verified).toBe(true);
  });

  it("accepts one typo in a long quote", () => {
    const r = verifyQuote("In ons atelier in Zwolle maken wij elke tafle met de hand.", page);
    expect(r.verified).toBe(true);
    expect(r.ratio).toBeGreaterThan(0.95);
  });

  it("rejects a paraphrase or invented claim", () => {
    expect(verifyQuote("Wij maken al onze meubels zelf in Nederland.", page).verified).toBe(false);
    expect(verifyQuote("100% handgemaakt in ons eigen atelier", page).verified).toBe(false);
  });

  it("rejects quotes that are too short or too long", () => {
    expect(verifyQuote("tafel", page).verified).toBe(false);
    expect(verifyQuote("a".repeat(301), "a".repeat(400)).verified).toBe(false);
  });
});

describe("redactPersonalData", () => {
  it.each([
    ["Hoi, ik ben Anna de Vries en ik maak alles zelf.", "Hoi, ik ben [naam] en ik maak alles zelf."],
    ["Opgericht door Jan en Marie in 2012.", "Opgericht door [naam] in 2012."],
    ["Eigenaar: Pieter Bakker", "Eigenaar: [naam]"],
    ["Bezoek ons op Dorpsstraat 12a, 8011 AB Zwolle.", "Bezoek ons op [adres], [postcode] Zwolle."],
  ])("%j", (input, out) => {
    const r = redactPersonalData(input);
    expect(r.text).toBe(out);
    expect(r.redacted).toBe(true);
  });

  it("leaves quotes without personal data alone", () => {
    const q = "Alle meubels worden op maat gemaakt van eikenhout.";
    expect(redactPersonalData(q)).toEqual({ text: q, redacted: false });
  });
});

describe("matchRate", () => {
  it("is the share of verified checks", () => {
    expect(matchRate([])).toBe(1);
    expect(matchRate([{ verified: true, ratio: 1 }, { verified: false, ratio: 0.5 }])).toBe(0.5);
  });
});
