import { describe, expect, it } from "vitest";
import { parseUtm, sourceWithUtm } from "./utm";

describe("parseUtm", () => {
  it("keeps only the three tags, lowercased", () => {
    expect(parseUtm("?utm_source=Meta&utm_medium=paid&utm_campaign=launch nov&fbclid=abc&email=x@y.nl")).toEqual({
      utm_source: "meta",
      utm_medium: "paid",
      utm_campaign: "launch-nov",
    });
  });
  it("reads a stored object and drops values that are not tags", () => {
    expect(parseUtm({ utm_source: "pinterest", utm_medium: "<script>", utm_campaign: 5 })).toEqual({ utm_source: "pinterest" });
    expect(parseUtm("?q=hout")).toBeNull();
    expect(parseUtm(null)).toBeNull();
  });
});

describe("sourceWithUtm", () => {
  it("appends the tags to the page path", () => {
    expect(sourceWithUtm("/top-25", { utm_source: "meta", utm_campaign: "launch" })).toBe("/top-25?utm_source=meta&utm_campaign=launch");
    expect(sourceWithUtm("/", null)).toBe("/");
  });
});
