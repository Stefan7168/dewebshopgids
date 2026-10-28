import { describe, expect, it } from "vitest";
import { crawlFailed } from "./run-crawl";

describe("crawlFailed", () => {
  it("fails over 10% errors once there are at least 3", () => {
    expect(crawlFailed(3, 20)).toBe(true);
    expect(crawlFailed(6, 60)).toBe(false);
    expect(crawlFailed(7, 60)).toBe(true);
  });
  it("does not fail a small night on one or two unreachable sites", () => {
    expect(crawlFailed(1, 4)).toBe(false);
    expect(crawlFailed(2, 3)).toBe(false);
  });
});
