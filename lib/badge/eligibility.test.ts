import { describe, expect, it } from "vitest";
import { CHECKOUT_BLOCK_TEXT, badgeEligibility, checkoutBlock, isCheckoutBlock } from "./eligibility";

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

describe("checkoutBlock", () => {
  const now = new Date("2026-10-29T10:00:00Z");
  const claim = { expires_at: "2026-11-05T00:00:00Z" };
  it("lets a live claim of an eligible shop through", () => {
    expect(checkoutBlock(claim, base, now)).toBeNull();
  });
  it("blocks a missing or expired claim link, before looking at the shop", () => {
    expect(checkoutBlock(null, base, now)).toBe("link");
    expect(checkoutBlock(claim, null, now)).toBe("link");
    expect(checkoutBlock({ expires_at: "2026-10-28T00:00:00Z" }, base, now)).toBe("link");
  });
  it("blocks shops that may not buy, so payment never starts", () => {
    expect(checkoutBlock(claim, { ...base, verified_badge_until: "2026-12-01" }, now)).toBe("actief");
    expect(checkoutBlock(claim, { ...base, status: "removed" }, now)).toBe("niet_gepubliceerd");
    expect(checkoutBlock(claim, { ...base, score: 50 }, now)).toBe("score");
  });
  it("accepts only known codes from the URL", () => {
    for (const code of Object.keys(CHECKOUT_BLOCK_TEXT)) expect(isCheckoutBlock(code)).toBe(true);
    expect(isCheckoutBlock("1")).toBe(false);
    expect(isCheckoutBlock("constructor")).toBe(false);
    expect(isCheckoutBlock(undefined)).toBe(false);
  });
});
