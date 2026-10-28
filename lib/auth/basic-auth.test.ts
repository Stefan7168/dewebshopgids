import { describe, expect, it } from "vitest";
import { isAuthorized, isPublicPath } from "./basic-auth";

const header = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;

describe("isPublicPath", () => {
  it("exempts /over and its subpaths", () => {
    expect(isPublicPath("/over")).toBe(true);
    expect(isPublicPath("/over/team")).toBe(true);
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/go/houtatelier")).toBe(true);
  });
  it("does not exempt look-alikes or the home page", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/overig")).toBe(false);
    expect(isPublicPath("/admin")).toBe(false);
  });
});

describe("isAuthorized", () => {
  it("accepts the right credentials", () => {
    expect(isAuthorized(header("stefan", "p:w"), "stefan", "p:w")).toBe(true);
  });
  it("rejects wrong, missing or malformed headers", () => {
    expect(isAuthorized(header("stefan", "nope"), "stefan", "p:w")).toBe(false);
    expect(isAuthorized(null, "stefan", "p:w")).toBe(false);
    expect(isAuthorized("Bearer x", "stefan", "p:w")).toBe(false);
    expect(isAuthorized("Basic !!!", "stefan", "p:w")).toBe(false);
  });
});
