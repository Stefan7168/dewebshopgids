import { describe, expect, it } from "vitest";
import { validateReplySlots } from "../disputes/replies";
import { factColumns, OVERRIDE_FACTS, parseFactInput } from "./facts";

describe("parseFactInput", () => {
  it("parses each fact and keeps the public value a valid reply slot", () => {
    const cases = {
      online: ["2015", { year: 2015 }, "sinds 2015"],
      assortiment: ["40", { count: 40 }, "Minder dan 50 producten"],
      keurmerk: ["Thuiswinkel Waarborg, webwinkelkeur", { keurmerk: ["thuiswinkel", "webwinkelkeur"] }, "Thuiswinkel Waarborg, WebwinkelKeur"],
      prijsniveau: ["Luxe", { level: 4 }, "luxe"],
      winkel: ["Den Bosch", { store: true, city: "Den Bosch" }, "winkel in Den Bosch"],
      verzending: ["nl", { country: "NL" }, "verzendt vanuit NL"],
      beschrijving: ["Kleine meubelmakerij in Utrecht die alles zelf maakt.", { text: "Kleine meubelmakerij in Utrecht die alles zelf maakt." }, "beschrijving aangepast"],
    } as const;
    for (const fact of OVERRIDE_FACTS) {
      const [input, value, publicValue] = cases[fact];
      const r = parseFactInput(fact, input, 2026);
      expect(r).toEqual({ ok: true, value, publicValue });
      if (r.ok) expect(validateReplySlots("dispute_corrected", { corrected_facts: [{ fact, value: r.publicValue }] }).ok).toBe(true);
    }
  });

  it("rejects bad input", () => {
    expect(parseFactInput("online", "2030", 2026).ok).toBe(false);
    expect(parseFactInput("online", "1980", 2026).ok).toBe(false);
    expect(parseFactInput("assortiment", "veel").ok).toBe(false);
    expect(parseFactInput("keurmerk", "keurmerk van mezelf").ok).toBe(false);
    expect(parseFactInput("prijsniveau", "5").ok).toBe(false);
    expect(parseFactInput("winkel", "<script>").ok).toBe(false);
    expect(parseFactInput("verzending", "Nederland").ok).toBe(false);
    expect(parseFactInput("beschrijving", "kort").ok).toBe(false);
  });

  it("handles none", () => {
    expect(parseFactInput("keurmerk", "geen")).toEqual({ ok: true, value: { keurmerk: [] }, publicValue: "geen keurmerk" });
    expect(parseFactInput("winkel", "nee")).toEqual({ ok: true, value: { store: false, city: null }, publicValue: "geen fysieke winkel" });
  });
});

describe("factColumns", () => {
  it("maps to shops columns", () => {
    expect(factColumns("online", { year: 2015 })).toEqual({ domain_first_seen: "2015-01-01", domain_age_sources: { manual: true, year: 2015, agree: true } });
    expect(factColumns("keurmerk", { keurmerk: [] })).toEqual({ keurmerk: [], keurmerk_status: "none", keurmerk_verified_method: null });
    expect(factColumns("keurmerk", { keurmerk: ["thuiswinkel"] })).toMatchObject({ keurmerk_status: "verified", keurmerk_verified_method: "manual" });
    expect(factColumns("winkel", { store: false, city: "X" })).toEqual({ has_physical_store: false, store_city: null });
    expect(factColumns("assortiment", { count: 12 })).toEqual({ product_count_est: 12, product_count_method: "manual" });
  });

  it("throws on a value it did not write", () => {
    expect(() => factColumns("online", { year: "2015" })).toThrow();
    expect(() => factColumns("keurmerk", {})).toThrow();
  });
});
