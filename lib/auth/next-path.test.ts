import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("keeps paths on this site", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/auth/update-password?x=1")).toBe("/auth/update-password?x=1");
  });
  it("falls back to / for anything that could leave the site", () => {
    for (const bad of [null, "", "https://evil.example", "//evil.example", "/\\evil.example", "admin", "javascript:alert(1)"]) {
      expect(safeNextPath(bad)).toBe("/");
    }
  });
});
