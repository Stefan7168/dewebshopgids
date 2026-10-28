// Which paid "Uitgelicht" shops a category page shows (plan v3 section 12). Pure, so unit tested.
// Rules: only the sub-category the shop is listed in, at most two, only shops with a numeric
// score of 70+, only while paid. The block is separate from the ranked list and labelled
// "Advertentie"; paying never changes a shop's score or its place in any list.
import { scoreDisplay, type Category, type PublicShop } from "../shops/present";

export const MAX_FEATURED_PER_CATEGORY = 2;
export const MIN_FEATURED_SCORE = 70;

export type FeaturedPlacement = { shop_id: string; active_until: string | null };

/** `placements` come from featured_public, which already holds only paid-up rows (no clock here: pages prerender). */
export function featuredFor(category: Category, shops: PublicShop[], placements: FeaturedPlacement[]): PublicShop[] {
  const paid = new Set(placements.filter((p) => p.active_until !== null).map((p) => p.shop_id));
  return shops
    .filter((s) => paid.has(s.id) && s.category_id === category.id)
    .filter((s) => scoreDisplay(s).kind === "number" && (s.score ?? 0) >= MIN_FEATURED_SCORE)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"))
    .slice(0, MAX_FEATURED_PER_CATEGORY);
}
