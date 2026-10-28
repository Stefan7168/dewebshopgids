import { describe, expect, it } from "vitest";
import { isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  it("matches case-insensitively against the allowlist", () => {
    expect(isAdminEmail("Stefan@Example.com", "a@b.nl, stefan@example.com")).toBe(true);
  });
  it("rejects unknown, empty or missing emails", () => {
    expect(isAdminEmail("x@y.nl", "a@b.nl")).toBe(false);
    expect(isAdminEmail(undefined, "a@b.nl")).toBe(false);
    expect(isAdminEmail("a@b.nl", "")).toBe(false);
  });
});
