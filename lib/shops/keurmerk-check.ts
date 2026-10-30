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
