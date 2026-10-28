import { describe, expect, it } from "vitest";
import { needsDraft } from "./guide";
import { needsCheck, parseFindings } from "../../fact-checker/tools/factcheck";

const t = (h: number) => new Date(Date.UTC(2026, 10, 2, h));

describe("guide agent queue rules", () => {
  it("drafts a new issue once and redrafts after a newer rejection, max 3 rounds", () => {
    expect(needsDraft({ slug: "s", status: "draft", drafted_at: null, checked_at: null, fact_check_report: null })).toBe(true);
    expect(needsDraft({ slug: "s", status: "draft", drafted_at: t(6), checked_at: null, fact_check_report: null })).toBe(false);
    expect(needsDraft({ slug: "s", status: "rejected", drafted_at: t(6), checked_at: t(8), fact_check_report: { round: 1 } })).toBe(true);
    expect(needsDraft({ slug: "s", status: "rejected", drafted_at: t(9), checked_at: t(8), fact_check_report: { round: 1 } })).toBe(false);
    expect(needsDraft({ slug: "s", status: "rejected", drafted_at: t(6), checked_at: t(8), fact_check_report: { round: 3 } })).toBe(false);
  });

  it("checks a draft that changed after the last check", () => {
    expect(needsCheck({ drafted_at: null, checked_at: null })).toBe(false);
    expect(needsCheck({ drafted_at: t(6), checked_at: null })).toBe(true);
    expect(needsCheck({ drafted_at: t(6), checked_at: t(8) })).toBe(false);
    expect(needsCheck({ drafted_at: t(9), checked_at: t(8) })).toBe(true);
  });

  it("accepts only a list of strings as findings", () => {
    expect(parseFindings('["a", "b"]')).toEqual(["a", "b"]);
    expect(() => parseFindings('[1]')).toThrow();
    expect(parseFindings(undefined)).toEqual([]);
  });
});
