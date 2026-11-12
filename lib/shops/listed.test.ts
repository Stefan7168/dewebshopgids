import { afterEach, describe, expect, it, vi } from "vitest";
import { __setLoaderForTests, isUnlistedShop } from "./listed";

afterEach(() => __setLoaderForTests(null));

describe("isUnlistedShop", () => {
  it("is false without database settings, so the proxy never blocks a page", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(await isUnlistedShop("anything")).toBe(false);
  });

  it("is true only for a slug that is not on the loaded list", async () => {
    __setLoaderForTests(async () => new Set(["houtatelier-noord"]));
    expect(await isUnlistedShop("houtatelier-noord", 0)).toBe(false);
    expect(await isUnlistedShop("bestaat-niet", 0)).toBe(true);
  });

  it("fails open when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    __setLoaderForTests(async () => {
      throw new Error("down");
    });
    expect(await isUnlistedShop("bestaat-niet", 0)).toBe(false);
  });

  it("reloads at most once a minute for an unknown slug, so a newly published shop shows quickly", async () => {
    let list = new Set<string>();
    const load = vi.fn(async () => list);
    __setLoaderForTests(load);
    expect(await isUnlistedShop("nieuw", 0)).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
    list = new Set(["nieuw"]);
    expect(await isUnlistedShop("nieuw", 30_000)).toBe(true); // within a minute: cached
    expect(load).toHaveBeenCalledTimes(1);
    expect(await isUnlistedShop("nieuw", 61_000)).toBe(false); // reloaded
    expect(load).toHaveBeenCalledTimes(2);
    expect(await isUnlistedShop("nieuw", 120_000)).toBe(false); // known slug: 5-minute cache
    expect(load).toHaveBeenCalledTimes(2);
  });
});
