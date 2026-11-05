import { describe, expect, it } from "vitest";
import { renderPrenotice } from "../../../lib/email/prenotice";
import { blockReason, prenoticeSlots, type Candidate } from "./publish";

const base: Candidate = {
  id: "s1", slug: "mooi-huis", name: "Mooi Huis", contact_email: "info@mooihuis.nl", score: 72, score_label: null,
  keurmerk: ["thuiswinkel"], keurmerk_status: "verified", product_count_est: 240, domain_first_seen: new Date("2014-03-01T00:00:00Z"),
  band: "number", enough_signals: true, verdicts: [],
};

describe("blockReason", () => {
  it("lets a scored shop with a contact address through", () => expect(blockReason(base)).toBeNull());
  it.each([
    [{ band: null }, "no score"],
    [{ enough_signals: false }, "fewer than 4 valid signals"],
    [{ verdicts: ["agree", "escalate"] }, "auditor escalated"],
    [{ band: "audit_required" }, "30 to 40 band without auditor agreement"],
    [{ contact_email: null }, "no contact email for the pre-notice"],
  ] as const)("%j -> %s", (patch, why) => expect(blockReason({ ...base, ...patch } as Candidate)).toBe(why));
  it("lets the 30 to 40 band through once the auditor agreed", () => expect(blockReason({ ...base, band: "audit_required", verdicts: ["agree"] })).toBeNull());
  it("lets a labelled shop through", () => expect(blockReason({ ...base, band: "label", score_label: "Grote winkel / marktplaats" })).toBeNull());
});

describe("prenotice email", () => {
  it("shows what the page will show", () => {
    const m = renderPrenotice(prenoticeSlots(base, "2026-11-04T00:30:00Z"))!;
    expect(m.subject).toBe("Mooi Huis komt in De Webshopgids");
    expect(m.text).toContain("Vanaf 4 november 2026 staat je webshop op https://dewebshopgids.nl/webshop/mooi-huis");
    expect(m.text).toContain("- Echtheidsscore: 72 van 100");
    expect(m.text).toContain("- Keurmerk: Thuiswinkel Waarborg (gecontroleerd bij de keurmerkorganisatie)");
    expect(m.text).toContain("- Online sinds: ongeveer 2014");
    expect(m.text).toContain("https://dewebshopgids.nl/herbeoordeling?shop=mooi-huis");
    expect(m.text).not.toMatch(/review|onbetrouwbaar/i);
    expect(m.text).toContain('gratis afbeelding "Vermeld op De Webshopgids"');
    expect(m.text).toContain("https://dewebshopgids.nl/beheer?shop=mooi-huis");
    expect(m.text).not.toMatch(/Geverifieerd|euro|badge/i);
  });
  it("shows the label instead of a number", () =>
    expect(renderPrenotice(prenoticeSlots({ ...base, score: 20, score_label: "Grote winkel / marktplaats" }, "2026-11-04T00:30:00Z"))!.text).toContain("- Echtheidsscore: Grote winkel / marktplaats"));
  it("refuses bad slots", () => {
    expect(renderPrenotice({ ...prenoticeSlots(base, "2026-11-04T00:30:00Z"), shop_slug: "../x" })).toBeNull();
    expect(renderPrenotice({ ...prenoticeSlots(base, "2026-11-04T00:30:00Z"), shop_name: "a\nb" })).toBeNull();
  });
});
