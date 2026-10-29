// Sitemap rules (batch 8 sitemap check, 2026-10-29). Pure, so unit tested.
import { MIN_SHOPS_TO_INDEX, promotedRoots, shopsInCategory, type Category, type PublicShop } from "../shops/present";

/**
 * Category pages that go in the sitemap: main categories that are promoted (Wonen always, others from
 * 30 published shops) and their subcategories, each with at least MIN_SHOPS_TO_INDEX shops. A hidden
 * main category and everything under it stays out, the same rule as the header and llms.txt.
 */
export function sitemapCategories(categories: Category[], shops: PublicShop[]): Category[] {
  const rootIds = new Set(promotedRoots(categories, shops).map((c) => c.id));
  return categories.filter((c) => rootIds.has(c.parent_id ?? c.id) && shopsInCategory(shops, c, categories).length >= MIN_SHOPS_TO_INDEX);
}

/** lastmod for a page: the newest updated_at of the shops it shows. Undefined when it shows none. */
export function newestUpdate(shops: Pick<PublicShop, "updated_at">[]): string | undefined {
  return shops.reduce<string | undefined>((m, s) => (!m || s.updated_at > m ? s.updated_at : m), undefined);
}

/** Public pages that are deliberately not in the sitemap, with the reason. The sitemap test fails on any other page left out. */
export const NOT_IN_SITEMAP: Record<string, string> = {
  "top-25": "noindex: a mirror of the home page ranking",
  zoeken: "noindex and disallowed in robots.txt",
  herbeoordeling: "dispute form, disallowed in robots.txt",
  "herbeoordeling/bevestig": "dispute confirmation link",
  beheer: "shop owner pages, noindex",
  "beheer/bewerk": "shop owner pages, noindex",
  "nieuwsbrief/bevestig": "newsletter confirmation link, noindex",
  "nieuwsbrief/afmelden": "unsubscribe link, noindex",
};
