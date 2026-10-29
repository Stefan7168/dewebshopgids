import { describe, expect, it } from "vitest";
import { badgeEligibility } from "./eligibility";

const base = { status: "published", score: 82, verified_badge_until: null };

describe("badgeEligibility", () => {
  it("lets a published 70+ shop buy", () => {
    expect(badgeEligibility(base).kind).toBe("can_buy");
    expect(badgeEligibility({ ...base, score: 70 }).kind).toBe("can_buy");
  });
  it("refuses below 70, unpublished, or with a running badge", () => {
    expect(badgeEligibility({ ...base, score: 69 }).kind).toBe("score_too_low");
    expect(badgeEligibility({ ...base, score: null }).kind).toBe("score_too_low");
    expect(badgeEligibility({ ...base, status: "disputed" }).kind).toBe("not_published");
    expect(badgeEligibility({ ...base, verified_badge_until: "2026-12-01" }, "2026-10-29")).toEqual({ kind: "active", until: "2026-12-01" });
    expect(badgeEligibility({ ...base, verified_badge_until: "2026-10-01" }, "2026-10-29").kind).toBe("can_buy");
  });
});
