import { describe, expect, it } from "vitest";
import { paidLinkProblem } from "./paid-link";

const base = { status: "published", score: 82, verified_badge_until: null, stripe_subscription_id: null };
const today = "2026-10-30";

describe("paidLinkProblem", () => {
  it("lets an eligible shop's payment switch the badge on", () => {
    expect(paidLinkProblem(base, "sub_1", today)).toBeNull();
    expect(paidLinkProblem({ ...base, verified_badge_until: "2026-09-01", stripe_subscription_id: "sub_old" }, "sub_1", today)).toBeNull();
  });
  it("refuses a Payment Link payment for a shop that may not have the badge", () => {
    expect(paidLinkProblem({ ...base, status: "removed" }, "sub_1", today)).toBe("not_published");
    expect(paidLinkProblem({ ...base, score: 40 }, "sub_1", today)).toBe("score_too_low");
  });
  it("refuses a second subscription while the first still runs, so it is not orphaned", () => {
    expect(paidLinkProblem({ ...base, verified_badge_until: "2026-12-01", stripe_subscription_id: "sub_old" }, "sub_new", today)).toBe("second_subscription");
  });
  it("accepts a retry of the same checkout", () => {
    expect(paidLinkProblem({ ...base, score: 40, verified_badge_until: "2026-12-01", stripe_subscription_id: "sub_1" }, "sub_1", today)).toBeNull();
  });
});
