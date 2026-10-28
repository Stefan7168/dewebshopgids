import { describe, expect, it } from "vitest";
import { shopSlugBase, slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it.each([
    ["Café Déco & Zo", "cafe-deco-en-zo"],
    ["  Houtatelier B.V. ", "houtatelier-b-v"],
    ["!!!", ""],
  ])("%j -> %j", (input, out) => expect(slugify(input)).toBe(out));
  it("caps length at 60 without a trailing dash", () => {
    const s = slugify("a ".repeat(100));
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("adds a numeric suffix when taken", () => {
    expect(uniqueSlug("lamp", new Set())).toBe("lamp");
    expect(uniqueSlug("lamp", new Set(["lamp", "lamp-2"]))).toBe("lamp-3");
  });
  it("gives 60 identical names 60 unique slugs", () => {
    const taken = new Set<string>();
    for (let i = 0; i < 60; i++) taken.add(uniqueSlug("woonwinkel", taken));
    expect(taken.size).toBe(60);
  });
});

describe("shopSlugBase", () => {
  it("falls back to the domain", () => {
    expect(shopSlugBase(null, "stoer-wonen.nl")).toBe("stoer-wonen");
    expect(shopSlugBase("***", "lampenhuis.nl")).toBe("lampenhuis");
  });
});
