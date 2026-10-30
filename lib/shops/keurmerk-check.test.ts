import { describe, expect, it } from "vitest";
import { keurmerkRowText, newestCheckPerShop, shopsByCity } from "./keurmerk-check";

describe("keurmerkRowText", () => {
  it("names a confirmed keurmerk with its check date", () => {
    expect(keurmerkRowText({ keurmerk: ["thuiswinkel"], keurmerk_status: "verified" }, "2026-10-12")).toBe("Thuiswinkel Waarborg, gecontroleerd op 12 oktober 2026");
    expect(keurmerkRowText({ keurmerk: ["webwinkelkeur"], keurmerk_status: "verified" })).toBe("WebwinkelKeur (gecontroleerd)");
  });
  it("shows nothing for a keurmerk that was not confirmed", () => {
    expect(keurmerkRowText({ keurmerk: ["thuiswinkel"], keurmerk_status: "unverified" }, "2026-10-12")).toBeNull();
    expect(keurmerkRowText({ keurmerk: [], keurmerk_status: "none" })).toBeNull();
  });
});

describe("newestCheckPerShop", () => {
  it("keeps the newest day per shop", () => {
    const m = newestCheckPerShop([
      { shop_id: "a", fetched_at: "2026-09-01T02:00:00Z" },
      { shop_id: "a", fetched_at: "2026-10-03T02:00:00Z" },
      { shop_id: "b", fetched_at: "2026-08-20T02:00:00Z" },
    ]);
    expect(Object.fromEntries(m)).toEqual({ a: "2026-10-03", b: "2026-08-20" });
  });
});

describe("shopsByCity", () => {
  it("groups store cities alphabetically and keeps list order inside a city", () => {
    const s = (name: string, store_city: string | null, has_physical_store = true) => ({ name, store_city, has_physical_store });
    const groups = shopsByCity([s("A", "Utrecht"), s("B", "Amsterdam"), s("C", "Utrecht"), s("D", null), s("E", "Zwolle", false)]);
    expect(groups.map(([c, list]) => [c, list.map((x) => x.name)])).toEqual([
      ["Amsterdam", ["B"]],
      ["Utrecht", ["A", "C"]],
    ]);
  });
});
