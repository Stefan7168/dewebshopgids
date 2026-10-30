import { describe, expect, it } from "vitest";
import { BADGE_MIN_SCORE, UITGELICHT_EUR } from "@/lib/badge/pricing";
import { ownerFaqs } from "./faq";

describe("owner FAQ", () => {
  const text = ownerFaqs().flatMap((f) => [f.q, f.a]).join(" ");
  it("uses the prices and limits the rest of the site uses", () => {
    expect(text).toContain("€ 15 per maand of € 149 per jaar");
    expect(text).toContain(`€ ${UITGELICHT_EUR} per maand`);
    expect(text).toContain(`${BADGE_MIN_SCORE} of hoger`);
  });
  it("keeps the voice rules and says payment never changes the order", () => {
    expect(text).not.toMatch(/review|onbetrouwbaar/i);
    expect(text).toMatch(/veranderen daar niets aan/);
  });
  it("has unique questions", () => {
    const qs = ownerFaqs().map((f) => f.q);
    expect(new Set(qs).size).toBe(qs.length);
  });
});
