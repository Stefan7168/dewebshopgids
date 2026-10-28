import { describe, expect, it } from "vitest";
import { computeScore, scalePoints } from "./compute";
import { MARKETPLACE_LABEL } from "./weights";

describe("scalePoints", () => {
  it.each([
    [null, 0],
    [0, 20],
    [299, 20],
    [300, 20],
    [2650, 10],
    [4999, 0],
    [5000, 0],
    [120000, 0],
  ])("%j products -> %j points", (count, pts) => expect(scalePoints(count)).toBe(pts));
});

describe("computeScore", () => {
  it("scores a small custom furniture maker near the top", () => {
    const r = computeScore({
      own_production: true,
      focus: "single_niche",
      has_named_owner: true,
      has_address: true,
      has_kvk: true,
      origin_claims: ["handmade", "own_atelier", "made_in_nl"],
      product_count_est: 40,
    });
    expect(r.subScores).toEqual({ maker: 30, focus: 20, identity: 20, scale: 20, origin: 10 });
    expect(r.total).toBe(100);
    expect(r.band).toEqual({ display: "number" });
    expect(r.enoughSignals).toBe(true);
  });

  it("scores a marketplace low, caps it and shows the neutral label", () => {
    const r = computeScore({
      brand_owner: true,
      focus: "everything",
      has_address: true,
      has_kvk: true,
      marketplace_pattern: true,
      product_count_est: 1_000_000,
      keurmerk_verified: true,
    });
    expect(r.subScores.maker).toBe(5);
    expect(r.capsApplied).toContain("pattern_maker_cap");
    expect(r.total).toBe(25); // 5 + 0 + 13 = 18, lifted to the keurmerk floor
    expect(r.capsApplied).toContain("keurmerk_floor");
    expect(r.band).toEqual({ display: "label", text: MARKETPLACE_LABEL });
  });

  it("caps the total at 30 on a dropship pattern", () => {
    const r = computeScore({
      own_production: true,
      focus: "single_niche",
      has_named_owner: true,
      has_address: true,
      has_kvk: true,
      dropship_indicators: true,
      product_count_est: 100,
    });
    expect(r.total).toBe(30);
    expect(r.capsApplied).toEqual(["pattern_maker_cap", "pattern_total_cap"]);
    expect(r.band).toEqual({ display: "audit_required" });
  });

  it("puts 30 to 40 in the audit band", () => {
    const r = computeScore({ brand_owner: true, focus: "broad", has_kvk: true, product_count_est: 6000 });
    expect(r.total).toBe(30);
    expect(r.band).toEqual({ display: "audit_required" });
  });

  it("counts made_in_eu only without made_in_nl and caps origin at 10", () => {
    expect(computeScore({ origin_claims: ["made_in_nl", "made_in_eu"] }).subScores.origin).toBe(3);
    expect(computeScore({ origin_claims: ["made_in_eu"] }).subScores.origin).toBe(2);
    expect(computeScore({ origin_claims: ["handmade", "own_atelier", "made_in_nl", "made_in_eu"] }).subScores.origin).toBe(
      10,
    );
  });

  it("gives no points for unknown signals and keeps the shop in draft", () => {
    const r = computeScore({ focus: "broad", product_count_est: null, has_kvk: null });
    expect(r.validSignals).toBe(1);
    expect(r.enoughSignals).toBe(false);
    expect(r.total).toBe(4);
  });

  it("never returns 0", () => {
    expect(computeScore({}).total).toBe(1);
  });
});
