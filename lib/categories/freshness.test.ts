import { describe, expect, it } from "vitest";
import { categoryTitle, freshnessLine, lastUpdated } from "./freshness";

describe("category freshness", () => {
  it("takes the newest update day", () => {
    expect(lastUpdated([{ updated_at: "2026-10-01T03:00:00+00:00" }, { updated_at: "2026-10-28T02:10:00+00:00" }])).toBe("2026-10-28");
    expect(lastUpdated([])).toBeNull();
  });
  it("says how many shops and when", () => {
    expect(freshnessLine(120, "2026-10-28")).toBe("120 webshops · bijgewerkt op 28 oktober 2026");
    expect(freshnessLine(1, null)).toBe("1 webshop");
  });
  it("uses the search title with the count, and the old title otherwise", () => {
    expect(categoryTitle("Wonen & interieur", "Leuke woonwebshops", 120)).toBe("Leuke woonwebshops: 120 unieke Nederlandse webshops");
    expect(categoryTitle("Wonen & interieur", "Leuke woonwebshops", 0)).toBe("Wonen & interieur: unieke en betrouwbare webshops");
    expect(categoryTitle("Meubels", undefined, 40)).toBe("Meubels: unieke en betrouwbare webshops");
  });
});
