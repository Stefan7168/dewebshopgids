// Calibration of the v1 weights against 30 real Dutch Home & Living shops (scripts/calibration/shops.json).
// Every shop must land in its blind-judged band, except the ones listed with a known_disagreement:
// those must still miss, so a weight change that fixes or breaks one shows up here and the file is updated.
import { describe, expect, it } from "vitest";
import { computeScore, type ScoringSignals } from "../../lib/scoring/compute";
import { SCORE_VERSION } from "../../lib/scoring/weights";
import data from "./shops.json";

type Shop = { domain: string; expected_band: [number, number]; signals: ScoringSignals; known_disagreement?: string };
const shops = data.shops as unknown as Shop[];

describe("scoring calibration set", () => {
  it("has 30 shops and matches the current score version", () => {
    expect(shops).toHaveLength(30);
    expect(data.score_version).toBe(SCORE_VERSION);
  });

  for (const s of shops) {
    it(`${s.domain} ${s.known_disagreement ? "still misses" : "lands in"} ${s.expected_band.join(" to ")}`, () => {
      const { total } = computeScore(s.signals);
      const inBand = total >= s.expected_band[0] && total <= s.expected_band[1];
      expect(inBand, `${s.domain} scored ${total}`).toBe(!s.known_disagreement);
    });
  }

  it("orders makers above brands above retailers on average", () => {
    const avg = (pred: (s: Shop) => boolean) => {
      const xs = shops.filter(pred).map((s) => computeScore(s.signals).total);
      return xs.reduce((a, b) => a + b, 0) / xs.length;
    };
    const makers = avg((s) => s.signals.own_production === true);
    const brands = avg((s) => !s.signals.own_production && s.signals.brand_owner === true && !s.signals.marketplace_pattern);
    const big = avg((s) => s.signals.marketplace_pattern === true);
    expect(makers).toBeGreaterThan(brands);
    expect(brands).toBeGreaterThan(big);
  });
});
