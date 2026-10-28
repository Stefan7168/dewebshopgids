import { describe, expect, it } from "vitest";
import { applyFilters, hasFilters, NO_FILTERS, parseFilters, toggleHref } from "./filters";
import type { PublicShop } from "./present";

type F = Pick<PublicShop, "keurmerk_status" | "has_physical_store" | "ships_from_country" | "price_level">;
const shop = (o: Partial<F>): F => ({
  keurmerk_status: "none",
  has_physical_store: null,
  ships_from_country: null,
  price_level: null,
  ...o,
});

describe("parseFilters", () => {
  it("reads known values and ignores the rest", () => {
    expect(parseFilters({ keurmerk: "1", winkel: "0", nl: ["1", "0"], prijs: "3" })).toEqual({
      keurmerk: true,
      winkel: false,
      nl: true,
      prijs: 3,
    });
    expect(parseFilters({ prijs: "9", keurmerk: "ja" })).toEqual(NO_FILTERS);
    expect(parseFilters({ prijs: "2.5" }).prijs).toBeNull();
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(hasFilters({ ...NO_FILTERS, prijs: 1 })).toBe(true);
  });
});

describe("applyFilters", () => {
  const list = [
    shop({
      keurmerk_status: "verified",
      has_physical_store: true,
      ships_from_country: "NL",
      price_level: 2,
    }),
    shop({
      keurmerk_status: "unverified",
      has_physical_store: false,
      ships_from_country: "BE",
      price_level: 2,
    }),
    shop({}),
  ];

  it("keeps order and drops shops whose fact is unknown", () => {
    expect(applyFilters(list, NO_FILTERS)).toEqual(list);
    expect(applyFilters(list, { ...NO_FILTERS, keurmerk: true })).toEqual([list[0]]);
    expect(applyFilters(list, { ...NO_FILTERS, winkel: true })).toEqual([list[0]]);
    expect(applyFilters(list, { ...NO_FILTERS, nl: true })).toEqual([list[0]]);
    expect(applyFilters(list, { ...NO_FILTERS, prijs: 2 })).toEqual([list[0], list[1]]);
  });
});

describe("toggleHref", () => {
  it("switches one filter and keeps the others", () => {
    expect(toggleHref("/categorie/meubels", NO_FILTERS, "keurmerk")).toBe("/categorie/meubels?keurmerk=1");
    const f = { ...NO_FILTERS, keurmerk: true, prijs: 2 };
    expect(toggleHref("/c", f, "keurmerk")).toBe("/c?prijs=2");
    expect(toggleHref("/c", f, "prijs", 2)).toBe("/c?keurmerk=1");
    expect(toggleHref("/c", f, "prijs", 3)).toBe("/c?keurmerk=1&prijs=3");
  });
});
