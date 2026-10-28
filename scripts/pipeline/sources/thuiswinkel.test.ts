import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCertificatePage, parseMemberSearchPage, searchPageUrl } from "./thuiswinkel";
import { normalizeDomain } from "../domain";

const fx = (f: string) => readFileSync(join(__dirname, "..", "fixtures", "thuiswinkel", f), "utf8");

describe("parseMemberSearchPage", () => {
  it("keeps only B2C member slugs, deduplicated", () => {
    const r = parseMemberSearchPage(fx("search-page-1.html"));
    expect(r.slugs).toEqual(["123-3d-b-v", "houtatelier", "lampenhuis"]);
    expect(r.hasNext).toBe(true);
    expect(r.page).toBe(1);
  });
  it("detects the last page", () => {
    expect(parseMemberSearchPage(fx("search-page-last.html")).hasNext).toBe(false);
  });
  it("builds page URLs", () => {
    expect(searchPageUrl(1)).toBe("https://www.thuiswinkel.org/en/member-search/");
    expect(searchPageUrl(3)).toBe("https://www.thuiswinkel.org/en/member-search/?page=3");
  });
});

describe("parseCertificatePage", () => {
  it("extracts name and website domain, nothing else", () => {
    expect(parseCertificatePage(fx("certificate.html"))).toEqual({
      name: "Houtatelier B.V.",
      websiteUrl: "http://www.Houtatelier.nl/",
      domain: "houtatelier.nl",
    });
  });
  it("returns nulls when the label is missing", () => {
    expect(parseCertificatePage("<h1>X</h1>").domain).toBeNull();
  });
});

describe("normalizeDomain", () => {
  it.each([
    ["https://www.Shop.nl/path?q=1", "shop.nl"],
    ["shop.nl", "shop.nl"],
    ["http://sub.shop.co.uk:8080", "sub.shop.co.uk"],
  ])("%s -> %s", (input, out) => expect(normalizeDomain(input)).toBe(out));
  it.each(["", "localhost", "http://10.0.0.1", "not a url"])("rejects %j", (input) =>
    expect(normalizeDomain(input)).toBeNull(),
  );
});
