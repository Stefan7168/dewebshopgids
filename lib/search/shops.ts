// Shop search for /zoeken. Plan v3 lists a Postgres `tsvector` index; with a few hundred published
// shops an in-memory match over the cached public list is enough and needs no migration (DECISIONS.md).
// The query is untrusted input: it is only compared as text and never stored or logged.
import { rankShops, type Category, type PublicShop } from "../shops/present";

export const MAX_QUERY_LENGTH = 80;
export const MIN_TERM_LENGTH = 2;

/** Lowercase, accents removed, everything but letters and digits as spaces. */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function queryTerms(q: string): string[] {
  return [...new Set(normalize(q.slice(0, MAX_QUERY_LENGTH)).split(" ").filter((t) => t.length >= MIN_TERM_LENGTH))].slice(0, 6);
}

/** Published shops matching every term in name, domain, description or category name; ordered by score like every list. */
export function searchShops(q: string, shops: PublicShop[], categories: Category[]): PublicShop[] {
  const terms = queryTerms(q);
  if (terms.length === 0) return [];
  const catName = new Map(categories.map((c) => [c.id, c.name_nl]));
  const parentOf = new Map(categories.map((c) => [c.id, c.parent_id]));
  const hits = shops.filter((s) => {
    const parent = s.category_id ? parentOf.get(s.category_id) : null;
    const haystack = normalize(
      [s.name, s.domain, s.description_nl, s.category_id && catName.get(s.category_id), parent && catName.get(parent)].filter(Boolean).join(" "),
    );
    return terms.every((t) => haystack.includes(t));
  });
  return rankShops(hits);
}
