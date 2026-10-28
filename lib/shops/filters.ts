// List filters for category pages (plan v3 phase 4, "filters"). Pure, so unit tested.
// A filter only removes shops; it never changes the order, so the ranking disclosure stays true.
import type { PublicShop } from "./present";

export type ShopFilters = {
  keurmerk: boolean;
  winkel: boolean;
  nl: boolean;
  prijs: number | null;
};
type FilterKey = keyof ShopFilters;
type Params = Record<string, string | string[] | undefined>;

export const NO_FILTERS: ShopFilters = {
  keurmerk: false,
  winkel: false,
  nl: false,
  prijs: null,
};

export const PRICE_FILTERS = [
  { level: 1, label: "Voordelig" },
  { level: 2, label: "Middensegment" },
  { level: 3, label: "Hoger segment" },
  { level: 4, label: "Luxe" },
] as const;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Unknown or malformed values are ignored, so a bad link shows the full list. */
export function parseFilters(params: Params): ShopFilters {
  const prijs = Number(first(params.prijs));
  return {
    keurmerk: first(params.keurmerk) === "1",
    winkel: first(params.winkel) === "1",
    nl: first(params.nl) === "1",
    prijs: Number.isInteger(prijs) && prijs >= 1 && prijs <= 4 ? prijs : null,
  };
}

export function hasFilters(f: ShopFilters): boolean {
  return f.keurmerk || f.winkel || f.nl || f.prijs !== null;
}

type Filterable = Pick<PublicShop, "keurmerk_status" | "has_physical_store" | "ships_from_country" | "price_level">;

/** Unknown facts never pass a filter: we only show what we measured. */
export function applyFilters<T extends Filterable>(shops: T[], f: ShopFilters): T[] {
  return shops.filter(
    (s) =>
      (!f.keurmerk || s.keurmerk_status === "verified") &&
      (!f.winkel || s.has_physical_store === true) &&
      (!f.nl || s.ships_from_country === "NL") &&
      (f.prijs === null || s.price_level === f.prijs),
  );
}

/** Query string for the filters with one key switched; prijs toggles off when chosen again. */
export function toggleHref(path: string, f: ShopFilters, key: FilterKey, prijs?: number): string {
  const next: ShopFilters = { ...f };
  if (key === "prijs") next.prijs = f.prijs === prijs ? null : (prijs ?? null);
  else next[key] = !f[key];
  const q = new URLSearchParams();
  if (next.keurmerk) q.set("keurmerk", "1");
  if (next.winkel) q.set("winkel", "1");
  if (next.nl) q.set("nl", "1");
  if (next.prijs !== null) q.set("prijs", String(next.prijs));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
