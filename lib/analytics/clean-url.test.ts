import { describe, expect, it } from "vitest";
import { cleanAnalyticsUrl } from "./clean-url";

describe("cleanAnalyticsUrl", () => {
  it("keeps utm parameters, so AI referrals stay visible", () =>
    expect(cleanAnalyticsUrl("https://dewebshopgids.nl/webshop/x?utm_source=chatgpt.com&ref=1")).toBe("https://dewebshopgids.nl/webshop/x?utm_source=chatgpt.com"));
  it("drops tokens from confirmation links", () =>
    expect(cleanAnalyticsUrl("https://dewebshopgids.nl/herbeoordeling/bevestig?token=abc#x")).toBe("https://dewebshopgids.nl/herbeoordeling/bevestig"));
  it.each(["/admin", "/admin/agents", "/auth/login", "/go/mooi-huis"])("does not track %s", (p) =>
    expect(cleanAnalyticsUrl(`https://dewebshopgids.nl${p}`)).toBeNull());
  it("tracks pages that only start with a private word", () => expect(cleanAnalyticsUrl("https://dewebshopgids.nl/administratie")).not.toBeNull());
  it("drops unparseable URLs", () => expect(cleanAnalyticsUrl("not a url")).toBeNull());
});
