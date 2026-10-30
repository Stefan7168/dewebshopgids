import { describe, expect, it } from "vitest";
import { DESCRIPTION_MAX, TITLE_MAX, shopDescription, shopTitle } from "./shop-meta";

const base = {
  name: "Houtatelier Noord",
  domain: "houtatelier-noord.nl",
  keurmerk: ["thuiswinkel"],
  keurmerk_status: "verified" as const,
  domain_first_seen: "2009-03-14",
  score: 94,
  score_label: null,
  status: "published" as const,
  store_city: "Groningen",
  has_physical_store: true,
  description_nl: "Massief eiken tafels en kasten, op maat gemaakt in een eigen werkplaats in Groningen.",
};

describe("shopTitle", () => {
  it("names the facts people search for", () => {
    expect(shopTitle(base)).toBe("Houtatelier Noord: keurmerk Thuiswinkel Waarborg, online sinds 2009, echtheidsscore 94");
  });
  it("leaves out an unchecked keurmerk and a score that is not shown", () => {
    expect(shopTitle({ ...base, keurmerk_status: "unverified", status: "disputed" })).toBe("Houtatelier Noord: online sinds 2009");
    expect(shopTitle({ ...base, score_label: "audit_required", keurmerk: [] })).toBe("Houtatelier Noord: online sinds 2009");
  });
  it("drops facts from the end to fit, and falls back without facts", () => {
    const long = shopTitle({ ...base, name: "Het Grote Ambachtelijke Meubelhuis van Noord" });
    expect(long.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(long).toContain("keurmerk Thuiswinkel Waarborg");
    expect(shopTitle({ ...base, keurmerk: [], domain_first_seen: null, score: null })).toBe("Houtatelier Noord: echtheidsscore, keurmerk en feiten");
  });
});

describe("shopDescription", () => {
  it("leads with our own data, then the shop text, within 160 characters", () => {
    const d = shopDescription(base);
    expect(d.startsWith("Echtheidsscore 94 van 100. Keurmerk Thuiswinkel Waarborg, gecontroleerd. Online sinds 2009. Winkel in Groningen.")).toBe(true);
    expect(d.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(d.endsWith("…")).toBe(true);
  });
  it("never uses the words the voice rules forbid", () => {
    for (const d of [shopDescription(base), shopTitle(base)]) expect(d).not.toMatch(/review|onbetrouwbaar/i);
  });
  it("falls back to the domain when there are no facts", () => {
    expect(shopDescription({ ...base, keurmerk: [], domain_first_seen: null, score: null, has_physical_store: false, description_nl: null })).toBe(
      "Echtheidsscore, keurmerk en feiten over houtatelier-noord.nl.",
    );
  });
});
