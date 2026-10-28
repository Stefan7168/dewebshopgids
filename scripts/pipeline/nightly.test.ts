import { describe, expect, it } from "vitest";
import { amsterdamHour } from "./nightly";

describe("amsterdamHour", () => {
  it("maps both UTC crons to 01:00 in the right season", () => {
    expect(amsterdamHour(new Date("2026-07-01T23:00:00Z"))).toBe(1); // CEST, UTC+2
    expect(amsterdamHour(new Date("2026-07-02T00:00:00Z"))).toBe(2);
    expect(amsterdamHour(new Date("2026-12-01T23:00:00Z"))).toBe(0); // CET, UTC+1
    expect(amsterdamHour(new Date("2026-12-02T00:00:00Z"))).toBe(1);
  });
});
