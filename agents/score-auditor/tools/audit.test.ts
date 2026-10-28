import { describe, expect, it } from "vitest";
import { auditorTotal, verdictFor } from "./audit";

describe("verdictFor", () => {
  it.each([
    [0, false, "agree"],
    [-10, false, "agree"],
    [11, false, "review"],
    [-20, false, "review"],
    [21, false, "escalate"],
    [0, true, "escalate"],
  ] as const)("delta %j, marketplace disagreement %j -> %j", (delta, mp, out) => expect(verdictFor(delta, mp)).toBe(out));
});

describe("auditorTotal", () => {
  const sub = { maker: 30, focus: 20, identity: 14, scale: 20, origin: 7 };
  it("sums the sub-scores", () => expect(auditorTotal(sub, false, false)).toBe(91));
  it("applies the marketplace cap and the keurmerk floor like the pipeline", () => {
    expect(auditorTotal(sub, true, false)).toBe(30);
    expect(auditorTotal({ maker: 0, focus: 0, identity: 6, scale: 0, origin: 0 }, true, true)).toBe(25);
    expect(auditorTotal({ maker: 0, focus: 0, identity: 0, scale: 0, origin: 0 }, false, false)).toBe(1);
  });
});
