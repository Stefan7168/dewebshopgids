import { afterEach, describe, expect, it, vi } from "vitest";
import { __setLoaderForTests, isUnlisted } from "./listed";

afterEach(() => __setLoaderForTests(null));

describe("isUnlisted", () => {
  it("is false without database settings, so the proxy never blocks a page", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(await isUnlisted("shop", "anything")).toBe(false);
  });

  it("is true only for a slug that is not on the loaded list", async () => {
    __setLoaderForTests(async () => new Set(["houtatelier-noord"]));
    expect(await isUnlisted("shop", "houtatelier-noord", 0)).toBe(false);
    expect(await isUnlisted("shop", "bestaat-niet", 0)).toBe(true);
  });

  it("keeps one list per kind", async () => {
    __setLoaderForTests(async (kind) => new Set(kind === "category" ? ["wonen"] : ["2027-week-05"]));
    expect(await isUnlisted("category", "wonen", 0)).toBe(false);
    expect(await isUnlisted("guide", "wonen", 0)).toBe(true);
    expect(await isUnlisted("guide", "2027-week-05", 0)).toBe(false);
  });

  it("fails open when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    __setLoaderForTests(async () => {
      throw new Error("down");
    });
    expect(await isUnlisted("guide", "2027-week-05", 0)).toBe(false);
  });

  it("reloads at most once a minute for an unknown slug, so a newly published shop shows quickly", async () => {
    let list = new Set<string>();
    const load = vi.fn(async () => list);
    __setLoaderForTests(load);
    expect(await isUnlisted("shop", "nieuw", 0)).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
    list = new Set(["nieuw"]);
    expect(await isUnlisted("shop", "nieuw", 30_000)).toBe(true); // within a minute: cached
    expect(load).toHaveBeenCalledTimes(1);
    expect(await isUnlisted("shop", "nieuw", 61_000)).toBe(false); // reloaded
    expect(load).toHaveBeenCalledTimes(2);
    expect(await isUnlisted("shop", "nieuw", 120_000)).toBe(false); // known slug: 5-minute cache
    expect(load).toHaveBeenCalledTimes(2);
  });
});
