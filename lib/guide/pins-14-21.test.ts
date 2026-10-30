import { describe, expect, it } from "vitest";
import { pinProblem } from "../../agents/seo-growth-analyst/tools/analyst";
import { referencePins } from "./fixtures/pins-14-21";

describe("reference pins for gids issues 14 to 21", () => {
  it("has one pin per issue, each for its own week page", () => {
    expect(referencePins.map((p) => p.issue)).toEqual([14, 15, 16, 17, 18, 19, 20, 21]);
    // Issue 14 is 2027 week 6; one issue a week after that.
    referencePins.forEach((p) => expect(p.path).toBe(`/gids/2027-week-${String(p.issue - 8).padStart(2, "0")}`));
    expect(new Set(referencePins.map((p) => p.title)).size).toBe(referencePins.length);
  });

  it("passes the same checks as the Analyst's pin command and the pin_drafts table", () => {
    for (const p of referencePins) expect(pinProblem(p), `issue ${p.issue}`).toBeNull();
  });

  it("states no count, so it stays true when the Editor swaps or drops a shop", () => {
    for (const p of referencePins) expect(`${p.title} ${p.description}`, `issue ${p.issue}`).not.toMatch(/\d|vijf|\bvier\b/i);
  });
});
