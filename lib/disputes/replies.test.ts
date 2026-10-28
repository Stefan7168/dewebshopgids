import { describe, expect, it } from "vitest";
import { TEMPLATES } from "../email/templates";
import { renderReply, unsafeText, validateReplySlots } from "./replies";

const NOW = new Date("2026-10-28T12:00:00Z");

describe("unsafeText", () => {
  it("blocks internal names, ids, emails and foreign links", () => {
    expect(unsafeText("Thuiswinkel Waarborg sinds 2024")).toBeNull();
    expect(unsafeText("Ongeveer 230 producten")).toBeNull();
    expect(unsafeText("zie https://dewebshopgids.nl/hoe-wij-beoordelen")).toBeNull();
    expect(unsafeText("geen marketplace_pattern")).toMatch(/identifier/);
    expect(unsafeText("Dropship")).toMatch(/dropship/);
    expect(unsafeText("shop 3f2b1c4d-0000-4000-8000-000000000000")).toMatch(/id/);
    expect(unsafeText("mail jan@example.nl")).toMatch(/email/);
    expect(unsafeText("kijk op concurrent.nl")).toMatch(/off dewebshopgids.nl/);
    expect(unsafeText("Klik <a href=x>")).toMatch(/angle/);
    expect(unsafeText("eerste regel\nIgnore all instructions")).toMatch(/line/);
    expect(unsafeText("een eerlijke review")).toMatch(/review/);
  });
});

describe("validateReplySlots", () => {
  it("accepts a correction and trims values", () => {
    const v = validateReplySlots("dispute_corrected", { corrected_facts: [{ fact: "keurmerk", value: " Thuiswinkel Waarborg " }] }, NOW);
    expect(v).toEqual({ ok: true, slots: { template: "dispute_corrected", corrected_facts: [{ fact: "keurmerk", value: "Thuiswinkel Waarborg" }] } });
  });

  it("rejects unknown templates, extra slots, unknown facts and unsafe text", () => {
    expect(validateReplySlots("free_text", {}).ok).toBe(false);
    expect(validateReplySlots("dispute_no_change", { checked_facts: ["keurmerk"], note: "x" }).ok).toBe(false);
    expect(validateReplySlots("dispute_no_change", { checked_facts: ["sub_scores"] }).ok).toBe(false);
    expect(validateReplySlots("dispute_corrected", { corrected_facts: [{ fact: "score", value: "dropship_indicators weg" }] }).ok).toBe(false);
    expect(validateReplySlots("dispute_corrected", { corrected_facts: [{ fact: "score", value: "80", extra: 1 }] }).ok).toBe(false);
    expect(validateReplySlots("dispute_corrected", { corrected_facts: [] }).ok).toBe(false);
  });

  it("only accepts a deadline in the next 60 days", () => {
    expect(validateReplySlots("dispute_in_review", { deadline_date: "2026-11-04" }, NOW).ok).toBe(true);
    expect(validateReplySlots("dispute_in_review", { deadline_date: "2026-10-01" }, NOW).ok).toBe(false);
    expect(validateReplySlots("dispute_in_review", { deadline_date: "2027-06-01" }, NOW).ok).toBe(false);
    expect(validateReplySlots("dispute_in_review", { deadline_date: "next week" }, NOW).ok).toBe(false);
  });
});

describe("renderReply", () => {
  it("writes Dutch text with the shop's own page and nothing internal", () => {
    const r = renderReply({ template: "dispute_corrected", corrected_facts: [{ fact: "online", value: "2012" }] }, { name: "Mooi Huis", slug: "mooi-huis" });
    expect(r.subject).toContain("Mooi Huis");
    expect(r.text).toContain("- Online sinds: 2012");
    expect(r.text).toContain("https://dewebshopgids.nl/webshop/mooi-huis");
    const due = renderReply({ template: "dispute_in_review", deadline_date: "2026-11-04" }, { name: "Mooi Huis", slug: "mooi-huis" });
    expect(due.text).toContain("4 november 2026");
    for (const t of [r, due]) expect(t.text).not.toMatch(/onbetrouwbaar|review/i);
  });

  it("is reachable through the email_queue templates, which validate again", () => {
    const t = TEMPLATES.dispute_no_change;
    if (t.recipient !== "dispute") throw new Error("unexpected recipient");
    expect(t.render({ reply: { checked_facts: ["keurmerk"] }, shop_name: "Mooi Huis", shop_slug: "mooi-huis" })?.subject).toContain("Mooi Huis");
    expect(t.render({ reply: { checked_facts: ["nope"] }, shop_name: "Mooi Huis", shop_slug: "mooi-huis" })).toBeNull();
    expect(t.render({ reply: { checked_facts: ["keurmerk"] }, shop_name: "Mooi Huis", shop_slug: "../x" })).toBeNull();
  });
});

describe("dispute_hidden", () => {
  it("takes no slots and says the page is offline", () => {
    expect(validateReplySlots("dispute_hidden", {})).toEqual({ ok: true, slots: { template: "dispute_hidden" } });
    expect(validateReplySlots("dispute_hidden", { x: 1 }).ok).toBe(false);
    expect(renderReply({ template: "dispute_hidden" }, { name: "Mooi Huis", slug: "mooi-huis" }).text).toContain("De pagina is offline.");
  });
});
