import { describe, expect, it } from "vitest";
import { TEMPLATES } from "../../lib/email/templates";
import { previousMonth } from "./report";

describe("badge click report", () => {
  it("reports the previous calendar month, also across a year", () => {
    expect(previousMonth(new Date("2026-11-01T06:00:00Z")).month).toBe("2026-10");
    const jan = previousMonth(new Date("2027-01-01T06:00:00Z"));
    expect(jan.month).toBe("2026-12");
    expect(jan.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("renders the count and the embed code, and refuses bad slots", () => {
    const t = TEMPLATES.badge_click_report;
    if (t.recipient === "internal") throw new Error("unexpected");
    const r = t.render({ shop_name: "Atelier X", shop_slug: "atelier-x", month: "2026-10", clicks: 37 });
    expect(r?.subject).toBe("Atelier X in De Webshopgids: oktober 2026");
    expect(r?.text).toContain("37 keer");
    expect(r?.text).toContain('<img src="https://dewebshopgids.nl/badge/atelier-x"');
    expect(t.render({ shop_name: "X", shop_slug: "Bad Slug", month: "2026-10", clicks: 1 })).toBeNull();
    expect(t.marketing).toBeFalsy();
  });

  it("renders the free report with facts only: no badge, no price, no payment link", () => {
    const t = TEMPLATES.shop_click_report;
    if (t.recipient === "internal") throw new Error("unexpected");
    expect(t.marketing).toBe(true);
    const r = t.render({ shop_name: "Atelier X", shop_slug: "atelier-x", month: "2026-10", clicks: 12 });
    expect(r?.text).toContain("12 keer");
    expect(r?.text).toContain("https://dewebshopgids.nl/webshop/atelier-x");
    expect(r?.text).toContain("geclaimd");
    expect(r?.text).not.toMatch(/badge|geverifieerd|€|eur|stripe|betaal/i);
    expect(t.render({ shop_name: "Atelier X", shop_slug: "atelier-x", month: "2026-10", clicks: 1 })?.text).toContain("klikte een lezer");
    expect(t.render({ shop_name: "X", shop_slug: "x", month: "oktober", clicks: 1 })).toBeNull();
  });
});
