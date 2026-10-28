import { describe, expect, it } from "vitest";
import type { PublicShop } from "@/lib/shops/present";
import { confirmEmail, hashToken, isTokenShape, newToken, normaliseEmail, olderThan, signupHeadline, welcomeEmail, welcomeShops } from "./core";

const shop = (id: string, score: number | null, name = id): PublicShop =>
  ({ id, slug: id, name, score, score_label: null } as unknown as PublicShop);

describe("newsletter core", () => {
  it("uses the pre-launch copy until the guide starts", () => {
    expect(signupHeadline("februari")).toBe("Vanaf februari: elke week 5 unieke woonwinkels in je inbox");
    expect(signupHeadline(null)).toBe("Elke week 5 unieke woonwinkels in je inbox");
  });

  it("normalises and validates email addresses", () => {
    expect(normaliseEmail("  Jan@Voorbeeld.NL ")).toBe("jan@voorbeeld.nl");
    expect(normaliseEmail("geen-email")).toBeNull();
    expect(normaliseEmail("a@b")).toBeNull();
    expect(normaliseEmail("<script>@x.nl")).toBeNull();
  });

  it("makes url-safe tokens and stores only a hash", () => {
    const t = newToken();
    expect(isTokenShape(t)).toBe(true);
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).not.toContain(t);
    expect(isTokenShape("../../etc")).toBe(false);
  });

  it("puts the token only in our own confirm and unsubscribe links", () => {
    expect(confirmEmail("abc").text).toContain("https://dewebshopgids.nl/nieuwsbrief/bevestig?t=abc");
    const w = welcomeEmail([shop("a", 80, "Atelier A")], "tok");
    expect(w.text).toContain("1. Atelier A: https://dewebshopgids.nl/webshop/a");
    expect(w.text).toContain("/nieuwsbrief/afmelden?t=tok");
    expect(w.text).not.toContain("/go/");
  });

  it("picks the most clicked shops, then tops up by score", () => {
    const shops = [shop("a", 90), shop("b", 50), shop("c", 70), shop("d", 60)];
    expect(welcomeShops(shops, ["b", "b", "d", "zz"], 3).map((s) => s.id)).toEqual(["b", "d", "a"]);
  });

  it("compares ages in hours", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    expect(olderThan("2026-10-27T11:00:00Z", 24, now)).toBe(true);
    expect(olderThan("2026-10-28T11:00:00Z", 24, now)).toBe(false);
  });
});
