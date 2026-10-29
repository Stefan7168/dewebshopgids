import { describe, expect, it } from "vitest";
import { parseAffiliateUrl } from "./url";

describe("parseAffiliateUrl", () => {
  it("clears the link on empty input", () => {
    expect(parseAffiliateUrl("  ")).toEqual({ ok: true, url: null });
  });

  it("accepts an https network link and keeps its query string", () => {
    expect(parseAffiliateUrl(" https://ds1.nl/c/?si=1&li=2&wi=3&ws= ")).toEqual({ ok: true, url: "https://ds1.nl/c/?si=1&li=2&wi=3&ws=" });
  });

  it.each([
    ["http://ds1.nl/c/?li=1", "https"],
    ["javascript:alert(1)", "https"],
    ["ds1.nl/c/?li=1", "geen geldige link"],
    ["https://user:pw@ds1.nl/c", "inloggegevens"],
    ["https://dewebshopgids.nl/go/x", "eigen site"],
    ["https://www.dewebshopgids.nl/", "eigen site"],
    ["https://dewebshopgids.vercel.app/", "eigen site"],
    [`https://ds1.nl/${"a".repeat(2000)}`, "2000"],
  ])("rejects %s", (raw, part) => {
    const r = parseAffiliateUrl(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(part);
  });
});
