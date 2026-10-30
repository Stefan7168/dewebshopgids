import { describe, expect, it } from "vitest";
import { guideNeighbours } from "./neighbours";

const g = (iso_year: number, iso_week: number) => ({ slug: `${iso_year}-week-${String(iso_week).padStart(2, "0")}`, iso_year, iso_week, title_nl: null });
const all = [g(2027, 1), g(2026, 52), g(2026, 44), g(2026, 45)];

describe("guideNeighbours", () => {
  it("finds the issue before and after, across a year end", () => {
    expect(guideNeighbours(all, "2026-week-52")).toEqual({ older: g(2026, 45), newer: g(2027, 1) });
  });
  it("has no older issue for the first and no newer one for the latest", () => {
    expect(guideNeighbours(all, "2026-week-44").older).toBeNull();
    expect(guideNeighbours(all, "2027-week-01").newer).toBeNull();
  });
  it("returns nothing for an unknown issue", () => {
    expect(guideNeighbours(all, "2025-week-01")).toEqual({ older: null, newer: null });
  });
});
