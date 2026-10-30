import { describe, expect, it } from "vitest";
import { MIN_SHOPS_FOR_STATS, siteStats, statLines } from "./stats";

const shop = (i: number) => ({
  keurmerk: i % 4 === 0 ? ["thuiswinkel"] : [],
  keurmerk_status: (i % 4 === 0 ? "verified" : i % 4 === 1 ? "unverified" : "none") as "verified" | "unverified" | "none",
  domain_first_seen: `${2006 + i}-01-01`,
  has_physical_store: i % 5 === 0,
  score: 50 + i,
  score_label: null,
  status: "published" as const,
});

describe("siteStats", () => {
  it("says nothing below the minimum", () => {
    expect(siteStats(Array.from({ length: MIN_SHOPS_FOR_STATS - 1 }, (_, i) => shop(i)), "2026-10-30")).toBeNull();
  });
  it("counts only confirmed keurmerken and gives the median age", () => {
    const s = siteStats(Array.from({ length: 20 }, (_, i) => shop(i)), "2026-10-30")!;
    expect(s).toEqual({ shops: 20, keurmerkPct: 25, medianYearsOnline: 10, storePct: 20, score70Pct: 0 });
    expect(statLines(s)).toContain("De helft is 10 jaar of langer online.");
  });
  it("leaves a score under review out of the 70+ share", () => {
    const shops = Array.from({ length: 20 }, (_, i) => ({ ...shop(i), score: 80, status: i < 5 ? ("disputed" as const) : ("published" as const) }));
    expect(siteStats(shops, "2026-10-30")!.score70Pct).toBe(75);
  });
  it("uses no opinion words", () => {
    const lines = statLines(siteStats(Array.from({ length: 20 }, (_, i) => shop(i)), "2026-10-30")!).join(" ");
    expect(lines).not.toMatch(/onbetrouwbaar|review|goed|slecht|veilig/i);
  });
});
