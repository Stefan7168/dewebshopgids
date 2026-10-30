import { describe, expect, it } from "vitest";
import { keurmerkRowText, newestCheckPerShop } from "./keurmerk-check";

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
