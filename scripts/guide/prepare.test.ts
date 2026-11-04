import { describe, expect, it } from "vitest";
import { guideKeurmerkText } from "./prepare";

describe("guideKeurmerkText", () => {
  it("names only a confirmed keurmerk", () => {
    expect(guideKeurmerkText({ keurmerk: ["thuiswinkel"], keurmerk_status: "verified" })).toBe("Thuiswinkel Waarborg (gecontroleerd bij de keurmerkorganisatie)");
    expect(guideKeurmerkText({ keurmerk: ["thuiswinkel"], keurmerk_status: "unverified" })).toBe("geen gecontroleerd keurmerk");
    expect(guideKeurmerkText({ keurmerk: [], keurmerk_status: "none" })).toBe("geen gecontroleerd keurmerk");
  });
});
