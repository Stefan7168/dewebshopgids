import { describe, expect, it } from "vitest";
import { change, forecastDue } from "./analyst";

describe("forecastDue", () => {
  it("is true in the first 7 days of the month in Amsterdam", () => {
    expect(forecastDue(new Date("2026-11-02T06:00:00Z"))).toBe(true);
    expect(forecastDue(new Date("2026-11-09T06:00:00Z"))).toBe(false);
    expect(forecastDue(new Date("2026-10-31T23:30:00Z"))).toBe(true); // already 1 November in Amsterdam
  });
});

describe("change", () => {
  it("rounds to whole percent", () => expect(change(130, 100)).toBe(30));
  it("is null without a base", () => expect(change(5, 0)).toBeNull());
});
