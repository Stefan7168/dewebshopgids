import { describe, expect, it } from "vitest";
import { dutchDate, MAX_CHANGES_SHOWN, scoreChanges, type ScoreRow } from "./score-history-rules";

const row = (day: number, total: number, score_version = "v2"): ScoreRow => ({
  total,
  score_version,
  created_at: new Date(Date.UTC(2026, 9, day, 1)).toISOString(),
});

describe("scoreChanges", () => {
  it("keeps only the runs where the total changed, newest first", () => {
    const rows = [row(1, 70), row(2, 70), row(3, 74), row(4, 74), row(5, 72)];
    expect(scoreChanges(rows, 72).map((c) => c.total)).toEqual([72, 74, 70]);
  });

  it("is empty when the score never changed", () => {
    expect(scoreChanges([row(1, 80), row(2, 80)], 80)).toEqual([]);
  });

  it("is empty when the newest row does not match the score on the page", () => {
    expect(scoreChanges([row(1, 70), row(2, 75)], 71)).toEqual([]);
  });

  it("marks a change that came with a new score version", () => {
    const c = scoreChanges([row(1, 70, "v2"), row(2, 65, "v3")], 65);
    expect(c[0]).toMatchObject({ total: 65, newMethod: true });
    expect(c[1]).toMatchObject({ total: 70, newMethod: false });
  });

  it("sorts unsorted input and caps the list", () => {
    const rows = Array.from({ length: 10 }, (_, i) => row(10 - i, 50 + (10 - i)));
    const c = scoreChanges(rows, 60);
    expect(c).toHaveLength(MAX_CHANGES_SHOWN);
    expect(c[0].total).toBe(60);
  });
});

describe("dutchDate", () => {
  it("writes the date in Dutch, Amsterdam time", () => {
    expect(dutchDate("2026-10-28T23:30:00Z")).toBe("29 oktober 2026");
  });
});
