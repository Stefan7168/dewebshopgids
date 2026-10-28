import { describe, expect, it } from "vitest";
import { createPoliteFetcher } from "../fetch-polite";
import { createFixtureFetch, createVirtualClock } from "../test-utils/fixture-fetch";
import { htmlToText, pickAboutLink, sameSiteLinks } from "../extract/text";
import { crawlShop } from "./crawl-shop";

function fetcher() {
  const { fetchImpl, requests } = createFixtureFetch();
  const clock = createVirtualClock();
  return { fetchPolite: createPoliteFetcher({ fetchImpl, now: clock.now, sleep: clock.sleep }).fetchPolite, requests };
}

describe("htmlToText", () => {
  it("drops scripts and styles, decodes entities, keeps line breaks", () => {
    expect(htmlToText("<style>a{}</style><p>Tafels &amp; banken&nbsp;&euro;&#8364;</p><script>x()</script><p>B</p>")).toBe(
      "Tafels & banken €€\nB",
    );
  });
});

describe("sameSiteLinks", () => {
  it("keeps same-host links, absolute, without fragments", () => {
    const html = `<a href="/over-ons#team">a</a><a href="https://www.shop.test/contact">b</a><a href="https://other.test/x">c</a><a href="mailto:x@y">d</a>`;
    const links = sameSiteLinks(html, "https://shop.test/");
    expect(links).toEqual(["https://shop.test/over-ons", "https://www.shop.test/contact"]);
    expect(pickAboutLink(links)).toBe("https://shop.test/over-ons");
  });
});

describe("crawlShop", () => {
  it("crawls a fixture shop and derives the rule facts", async () => {
    const { fetchPolite } = fetcher();
    const r = await crawlShop(fetchPolite, "makerij.test");
    if (!r.ok) throw new Error(r.error);
    expect(r.pages.map((p) => [p.pageType, p.url, p.statusCode])).toEqual([
      ["home", "https://makerij.test/", 200],
      ["about", "https://makerij.test/over-ons", 200],
      ["contact", "https://makerij.test/contact", 200],
      ["product", "https://makerij.test/products/eiken-tafel", 200],
      ["product", "https://makerij.test/products/eiken-bank", 200],
      ["product", "https://makerij.test/products/kruk", 500],
      ["keurmerk_certificate", "https://www.thuiswinkel.org/leden/de-makerij/certificaat", 200],
    ]);
    expect(r.platform).toBe("shopify");
    expect(r.productCount).toEqual({ count: 4, method: "sitemap" });
    expect(r.hasKvk).toBe(true);
    expect(r.contactEmail).toBe("info@makerij.test");
    expect(r.keurmerk).toEqual(["thuiswinkel"]);
    expect(r.keurmerkStatus).toBe("verified");
    expect(r.fetchErrors).toBe(1);
    expect(r.pages[1].text).toContain("Sinds 2014 maken wij alles met de hand");
    expect(r.pages[5].text).toBeNull();
  });

  it("fails when the home page is not reachable", async () => {
    const { fetchPolite } = fetcher();
    const r = await crawlShop(fetchPolite, "lampenhuis.test.invalid");
    expect(r.ok).toBe(false);
  });
});
