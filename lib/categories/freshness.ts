// Count, freshness and title for a category page (gap analysis 2026-10-30, change 3). Competing lists
// are years old; ours says how many shops it shows and when their data last changed. `updated_at`
// moves on every successful crawl (the shops trigger), so it is the date we last read the shops.
import { dutchDate } from "@/lib/shops/score-history-rules";
import type { PublicShop } from "@/lib/shops/present";

export function lastUpdated(shops: Pick<PublicShop, "updated_at">[]): string | null {
  const newest = shops.reduce((max, s) => (s.updated_at > max ? s.updated_at : max), "");
  return newest ? newest.slice(0, 10) : null;
}

export function freshnessLine(count: number, updatedOn: string | null): string {
  const shops = count === 1 ? "1 webshop" : `${count} webshops`;
  return updatedOn ? `${shops} · bijgewerkt op ${dutchDate(updatedOn)}` : shops;
}

/** "Leuke woonwebshops: 120 unieke Nederlandse webshops" when the page has a search title; otherwise the old pattern. */
export function categoryTitle(name: string, searchTitle: string | undefined, count: number): string {
  if (searchTitle && count > 0) return `${searchTitle}: ${count} unieke Nederlandse webshops`;
  return `${name}: unieke en betrouwbare webshops`;
}
