import { describe, expect, it } from "vitest";
import { checkOutreachDraft, renderOutreach, type OutreachCandidate } from "./check";

const c: OutreachCandidate = { id: "s1", slug: "atelier-x", name: "Atelier X", score: 84, clicks_30d: 37 };
const ok = {
  subject: "Je webshop in De Webshopgids",
  body: "Hoi,\n\nAtelier X staat in De Webshopgids met een echtheidsscore van 84 van 100. De afgelopen 30 dagen klikten 37 lezers door naar je shop: [shoppagina]\n\nMet de badge Geverifieerd (19 euro per maand) laat je dat zien. Aanmelden: [betaallink]",
};

describe("outreach draft checks", () => {
  it("accepts a factual draft with the payment placeholder once", () => {
    expect(checkOutreachDraft(ok, c)).toEqual([]);
  });

  it("rejects links, unknown numbers, score promises and a missing payment placeholder", () => {
    expect(checkOutreachDraft({ ...ok, body: ok.body.replace("[betaallink]", "https://buy.stripe.com/x") }, c)).toEqual(
      expect.arrayContaining(["body must contain [betaallink] exactly once", "no links, domains or email addresses: use the placeholders"]),
    );
    expect(checkOutreachDraft({ ...ok, body: `${ok.body} Je krijgt ook een hogere score.` }, c).some((f) => f.startsWith("banned"))).toBe(true);
    expect(checkOutreachDraft({ ...ok, body: ok.body.replace("37", "250") }, c)).toContain("number 250 is not in the data");
    expect(checkOutreachDraft({ ...ok, subject: "Geverifieerd [betaallink]" }, c)).toContain("placeholders belong in the body, not the subject");
  });

  it("fills the placeholders and always adds the opt-out", () => {
    const text = renderOutreach(ok.body, { pay: "https://buy.stripe.com/abc?client_reference_id=s1", shopPage: "https://dewebshopgids.nl/webshop/atelier-x" });
    expect(text).toContain("https://buy.stripe.com/abc?client_reference_id=s1");
    expect(text).toContain("https://dewebshopgids.nl/webshop/atelier-x");
    expect(text).not.toContain("[");
    expect(text).toMatch(/Antwoord met "stop"/);
  });
});
