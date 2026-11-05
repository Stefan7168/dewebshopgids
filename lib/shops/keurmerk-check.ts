// How a keurmerk reads in a list row (gap analysis 2026-10-30, change 2): only a keurmerk the
// keurmerkorganisatie confirmed is named, with the date its certificate page last confirmed it.
import { dutchDate } from "@/lib/shops/score-history-rules";
import { KEURMERK_NAMES, type PublicShop } from "@/lib/shops/present";

export function keurmerkRowText(s: Pick<PublicShop, "keurmerk" | "keurmerk_status">, checkedOn?: string | null): string | null {
  if (s.keurmerk_status !== "verified" || s.keurmerk.length === 0) return null;
  const names = s.keurmerk.map((k) => KEURMERK_NAMES[k] ?? k).join(", ");
  return checkedOn ? `${names}, gecontroleerd op ${dutchDate(checkedOn)}` : `${names} (gecontroleerd)`;
}

/** Newest confirmed check per shop from certificate-page rows, as YYYY-MM-DD. */
export function newestCheckPerShop(rows: { shop_id: string; fetched_at: string }[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const r of rows) {
    const day = r.fetched_at.slice(0, 10);
    if ((out.get(r.shop_id) ?? "") < day) out.set(r.shop_id, day);
  }
  return out;
}

/** Cities with a physical store in a list, alphabetical, each with its shops in list order. Not a ranking. */
export function shopsByCity<T extends { store_city: string | null; has_physical_store: boolean | null }>(shops: T[]): [string, T[]][] {
  // Grouped by the trimmed, lower-cased name, so "Amsterdam", "amsterdam" and "Amsterdam " are one city;
  // shown with the first spelling, capitalised.
  const by = new Map<string, { city: string; list: T[] }>();
  for (const s of shops) {
    const city = s.has_physical_store ? s.store_city?.trim() : null;
    if (!city) continue;
    const key = city.toLocaleLowerCase("nl");
    const group = by.get(key) ?? { city: city.charAt(0).toLocaleUpperCase("nl") + city.slice(1), list: [] };
    group.list.push(s);
    by.set(key, group);
  }
  return [...by.values()].map((g): [string, T[]] => [g.city, g.list]).sort(([a], [b]) => a.localeCompare(b, "nl"));
}
