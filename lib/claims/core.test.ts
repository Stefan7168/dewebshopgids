import { describe, expect, it } from "vitest";
import { claimEmail, descriptionProblem, normaliseDescription } from "./core";

const ok = "Wij maken tafels en kasten van Fries eikenhout in onze eigen werkplaats in Joure.";

describe("descriptionProblem", () => {
  it("accepts a plain description and normalises whitespace", () => {
    expect(normaliseDescription(`  ${ok}\n\n`)).toBe(ok);
    expect(descriptionProblem(ok)).toBeNull();
  });

  it("rejects short, long, contact details, links and reviews", () => {
    expect(descriptionProblem("Mooie tafels.")).toMatch(/minstens/);
    expect(descriptionProblem("a".repeat(601))).toMatch(/maximaal/);
    expect(descriptionProblem(`${ok} Bel 06-12345678.`)).toMatch(/telefoon/);
    expect(descriptionProblem(`${ok} Mail info@tafels.nl.`)).toMatch(/e-mail/);
    expect(descriptionProblem(`${ok} Zie www.andereshop.nl.`)).toMatch(/links/);
    expect(descriptionProblem(`${ok} Lees elke review.`)).toMatch(/beoordelingen/);
  });
});

describe("claimEmail", () => {
  it("links to the edit page with the token and says the score does not change", () => {
    const m = claimEmail("Tafelmakerij", "abc");
    expect(m.text).toContain("/beheer/bewerk?t=abc");
    expect(m.text).toContain("De score verandert er niet door.");
  });
});
