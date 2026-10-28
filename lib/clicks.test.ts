import { describe, expect, it } from "vitest";
import { countryCode, deviceFromUserAgent, redirectTarget, refererPath, sourceTag } from "./clicks";

describe("deviceFromUserAgent", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148", "mobile"],
    ["Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari/537.36", "mobile"],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", "tablet"],
    ["Mozilla/5.0 (Linux; Android 14; SM-X710) Safari/537.36", "tablet"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) Safari/605.1.15", "desktop"],
    ["Googlebot/2.1 (+http://www.google.com/bot.html)", "bot"],
    [null, "unknown"],
  ] as const)("%s -> %s", (ua, device) => expect(deviceFromUserAgent(ua)).toBe(device));
});

describe("refererPath", () => {
  it("keeps only same-host paths", () => {
    expect(refererPath("https://dewebshopgids.nl/webshop/a?x=1", "dewebshopgids.nl")).toBe("/webshop/a");
    expect(refererPath("https://google.com/search?q=x", "dewebshopgids.nl")).toBeNull();
    expect(refererPath("garbage", "dewebshopgids.nl")).toBeNull();
  });
});

describe("sourceTag and countryCode", () => {
  it("sanitises", () => {
    expect(sourceTag("Gids-2026<script>")).toBe("gids-2026script");
    expect(sourceTag("")).toBeNull();
    expect(countryCode("NL")).toBe("NL");
    expect(countryCode("nl")).toBeNull();
  });
});

describe("redirectTarget", () => {
  it("prefers an https affiliate URL", () => {
    expect(redirectTarget({ domain: "a.nl", affiliate_url: "https://ds1.nl/c/?si=1&li=2" })).toBe("https://ds1.nl/c/?si=1&li=2");
  });
  it("falls back to the shop domain", () => {
    expect(redirectTarget({ domain: "a.nl", affiliate_url: null })).toBe("https://a.nl/");
    expect(redirectTarget({ domain: "a.nl", affiliate_url: "javascript:alert(1)" })).toBe("https://a.nl/");
    expect(redirectTarget({ domain: "a.nl", affiliate_url: "http://insecure.nl" })).toBe("https://a.nl/");
  });
});
