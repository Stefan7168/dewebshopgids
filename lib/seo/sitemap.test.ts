import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Category, PublicShop } from "../shops/present";
import { NOT_IN_SITEMAP, newestUpdate, sitemapCategories } from "./sitemap";

const cat = (id: string, slug: string, parent_id: string | null): Category =>
  ({ id, slug, name_nl: slug, parent_id, intro_nl: null, seo_title: null, sort_order: 0 }) as Category;
const shop = (i: number, category_id: string, updated_at = "2026-10-01"): PublicShop =>
  ({ id: `s${i}`, slug: `s${i}`, category_id, updated_at }) as PublicShop;

describe("sitemap rules", () => {
  const cats = [cat("w", "wonen", null), cat("m", "meubels", "w"), cat("t", "tuin-buiten", null), cat("tm", "tuinmeubels", "t")];

  it("leaves out a hidden main category and its subcategories", () => {
    const shops = [...Array.from({ length: 6 }, (_, i) => shop(i, "m")), ...Array.from({ length: 29 }, (_, i) => shop(100 + i, "tm"))];
    expect(sitemapCategories(cats, shops).map((c) => c.slug)).toEqual(["wonen", "meubels"]);
  });

  it("includes a main category once it is promoted at 30 shops", () => {
    const shops = Array.from({ length: 30 }, (_, i) => shop(i, "tm"));
    expect(sitemapCategories(cats, shops).map((c) => c.slug)).toEqual(["tuin-buiten", "tuinmeubels"]);
  });

  it("uses the newest shop update as lastmod", () => {
    expect(newestUpdate([shop(1, "m", "2026-10-02"), shop(2, "m", "2026-10-28"), shop(3, "m", "2026-09-01")])).toBe("2026-10-28");
    expect(newestUpdate([])).toBeUndefined();
  });

  it("lists every static public page, or says why not", () => {
    const pages: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(dir, e.name));
        else if (e.name === "page.tsx") pages.push(dir.replace(/^app\/?/, ""));
      }
    };
    walk("app");
    const statics = pages.filter((p) => p !== "" && !p.includes("[") && !/^(admin|auth)(\/|$)/.test(p));
    const src = readFileSync("app/sitemap.ts", "utf8");
    const inSitemap = JSON.parse(src.match(/\.\.\.(\[[^\]]*"over"[^\]]*\])\.map/)![1]) as string[];
    const ownEntry = ["gids"]; // added once a guide is published
    for (const p of statics) expect(inSitemap.includes(p) || ownEntry.includes(p) || p in NOT_IN_SITEMAP, `/${p} is not in the sitemap`).toBe(true);
    for (const p of inSitemap) expect(pages, `/${p} has no page`).toContain(p);
    for (const p of Object.keys(NOT_IN_SITEMAP)) expect(inSitemap).not.toContain(p);
  });
});
