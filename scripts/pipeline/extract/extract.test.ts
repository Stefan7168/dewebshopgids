import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { countProductsFromSitemaps, isProductSitemap, parseSitemap } from "./sitemap";
import { detectPlatform } from "./platform";
import { hasKvkNumber } from "./kvk";
import { extractRoleEmail } from "./contact-email";
import { certificateMentionsDomain, findKeurmerkLinks } from "./keurmerk";
import { combineDomainAge, isSidnRateLimited, parseSidnCreationDate } from "./domain-age";

const fx = (f: string) => readFileSync(join(__dirname, "..", "fixtures", "extract", f), "utf8");

describe("sitemap product count", () => {
  it("parses index and urlset, including CDATA and &amp;", () => {
    expect(parseSitemap(fx("sitemap-index.xml")).locs[0]).toBe("https://houtatelier.nl/sitemap_products_1.xml?from=1&to=99");
    expect(parseSitemap(fx("sitemap-products-1.xml")).locs).toHaveLength(3);
  });
  it("recognises product sitemaps by platform naming", () => {
    expect(isProductSitemap("https://a.nl/sitemap_products_1.xml")).toBe(true);
    expect(isProductSitemap("https://a.nl/product-sitemap.xml")).toBe(true);
    expect(isProductSitemap("https://a.nl/product_cat-sitemap.xml")).toBe(false);
    expect(isProductSitemap("https://a.nl/sitemap_collections_1.xml")).toBe(false);
  });
  it("sums product sitemaps from an index", async () => {
    const files: Record<string, string> = {
      "https://houtatelier.nl/sitemap.xml": fx("sitemap-index.xml"),
      "https://houtatelier.nl/sitemap_products_1.xml?from=1&to=99": fx("sitemap-products-1.xml"),
      "https://houtatelier.nl/sitemap_products_2.xml": fx("sitemap-products-2.xml"),
    };
    const r = await countProductsFromSitemaps(["https://houtatelier.nl/sitemap.xml"], async (u) => files[u] ?? null);
    expect(r).toEqual({ count: 4, method: "sitemap" });
  });
  it("falls back to product-like URLs in a flat sitemap", async () => {
    const r = await countProductsFromSitemaps(["https://lampenhuis.nl/sitemap.xml"], async () => fx("sitemap-flat.xml"));
    expect(r).toEqual({ count: 2, method: "sitemap" });
  });
  it("returns null without sitemaps", async () => {
    expect(await countProductsFromSitemaps(["https://x.nl/sitemap.xml"], async () => null)).toBeNull();
  });
});

describe("detectPlatform", () => {
  it.each([
    [fx("shopify-home.html"), {}, "shopify"],
    [fx("woo-home.html"), {}, "woocommerce"],
    ['<img src="https://cdn.webshopapp.com/shops/1/logo.png">', {}, "lightspeed"],
    ['<script type="text/x-magento-init">{"*":{"Magento_Ui/js/core/app":{}}}</script>', {}, "magento"],
    ['<link href="/bundles/storefront/assets/css/all.css">', {}, "shopware"],
    ['<script src="https://cdn.ccv.eu/js/shop.js"></script>', {}, "ccvshop"],
    ["<html>plain</html>", { "X-ShopId": "123" }, "shopify"],
    ["<html>plain</html>", {}, "other"],
  ] as const)("fingerprint %#", (html, headers, platform) => expect(detectPlatform(html, headers)).toBe(platform));
});

describe("hasKvkNumber", () => {
  it.each([
    ["KvK: 12345678", true],
    ["Kamer van Koophandel onder nummer 8765 4321", true],
    ["12345678 (KvK)", true],
    ["K.v.K. 1234.5678", true],
    ["BTW NL001234567B01", false],
    ["KvK 1234567", false],
    ["Bel 0612345678 voor info over de KvK", false],
  ])("%j -> %s", (text, expected) => expect(hasKvkNumber(text)).toBe(expected));
});

describe("extractRoleEmail", () => {
  it("returns the role address and drops personal ones", () => {
    expect(extractRoleEmail(fx("shopify-home.html"), "houtatelier.nl")).toBe("info@houtatelier.nl");
  });
  it("decodes &#64; and ignores other domains", () => {
    expect(extractRoleEmail(fx("woo-home.html"), "lampenhuis.nl")).toBe("klantenservice@lampenhuis.nl");
  });
  it("returns null when only personal addresses exist", () => {
    expect(extractRoleEmail("mail jan@shop.nl of piet.jansen@shop.nl", "shop.nl")).toBeNull();
  });
});

describe("keurmerk", () => {
  it("finds badge links on a page", () => {
    expect(findKeurmerkLinks(fx("shopify-home.html")).map((l) => l.keurmerk)).toEqual(["thuiswinkel", "webwinkelkeur"]);
    expect(findKeurmerkLinks(fx("woo-home.html"))).toEqual([
      { keurmerk: "trusted_shops", url: "https://www.trustedshops.nl/verkopersbeoordeling/info_XA1B2C3D4E5F6.html" },
    ]);
  });
  it("verifies only when the certificate names the domain", () => {
    expect(certificateMentionsDomain("<dd>http://www.houtatelier.nl</dd>", "houtatelier.nl")).toBe(true);
    expect(certificateMentionsDomain("<dd>http://www.nothoutatelier.nl</dd>", "houtatelier.nl")).toBe(false);
    expect(certificateMentionsDomain("<dd>houtatelier.nl.evil.com</dd>", "houtatelier.nl")).toBe(false);
    expect(certificateMentionsDomain("Website: houtatelier.nl.", "houtatelier.nl")).toBe(true);
  });
});

describe("domain age", () => {
  it("parses SIDN WHOIS", () => {
    expect(parseSidnCreationDate(fx("sidn-whois.txt"))?.toISOString().slice(0, 10)).toBe("2009-04-02");
    expect(parseSidnCreationDate("Domain name: x.nl")).toBeNull();
    expect(isSidnRateLimited("Error: maximum number of requests per second exceeded")).toBe(true);
  });
  it("shows the age only when WHOIS and Wayback agree within 2 years", () => {
    const d = (s: string) => new Date(`${s}T00:00:00Z`);
    expect(combineDomainAge(d("2009-04-02"), d("2010-01-01")).show).toBe(true);
    expect(combineDomainAge(d("2009-04-02"), d("2010-01-01")).domain_first_seen?.getUTCFullYear()).toBe(2010);
    expect(combineDomainAge(d("2001-01-01"), d("2015-01-01")).show).toBe(false); // owner change or parked
    expect(combineDomainAge(null, d("2015-01-01")).show).toBe(false);
  });
});
