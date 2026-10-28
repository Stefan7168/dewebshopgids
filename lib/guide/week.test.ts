import { describe, expect, it } from "vitest";
import { guideSlug, isoWeek, issueForSendWeek, parseGuideSlug } from "./week";

describe("guide weeks", () => {
  it("computes ISO weeks across year ends", () => {
    expect(isoWeek(new Date(Date.UTC(2026, 9, 29)))).toEqual({ year: 2026, week: 44 }); // Thu 29 Oct 2026
    expect(isoWeek(new Date(Date.UTC(2027, 0, 1)))).toEqual({ year: 2026, week: 53 });
    expect(isoWeek(new Date(Date.UTC(2027, 0, 4)))).toEqual({ year: 2027, week: 1 });
  });

  it("uses the previous ISO week in Amsterdam time as the data window", () => {
    // Monday 2 Nov 2026 06:00 Amsterdam (05:00 UTC, winter time): issue for week 45.
    const i = issueForSendWeek(new Date("2026-11-02T05:00:00Z"));
    expect(i.slug).toBe("2026-week-45");
    expect(i.windowStart.toISOString()).toBe("2026-10-25T23:00:00.000Z"); // Mon 26 Oct 00:00 CET
    expect(i.windowEnd.toISOString()).toBe("2026-11-01T23:00:00.000Z");
  });

  it("handles a window that spans the switch to winter time", () => {
    const i = issueForSendWeek(new Date("2026-10-26T05:00:00Z")); // Monday of week 44
    expect(i.windowStart.toISOString()).toBe("2026-10-18T22:00:00.000Z"); // CEST
    expect(i.windowEnd.toISOString()).toBe("2026-10-25T23:00:00.000Z"); // CET
  });

  it("round-trips slugs", () => {
    expect(guideSlug(2026, 5)).toBe("2026-week-05");
    expect(parseGuideSlug("2026-week-05")).toEqual({ year: 2026, week: 5 });
    expect(parseGuideSlug("2026-week-54")).toBeNull();
    expect(parseGuideSlug("week-5")).toBeNull();
  });
});
