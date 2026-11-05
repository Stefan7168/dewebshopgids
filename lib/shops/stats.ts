// "Wat we zagen bij {n} webshops" on /hoe-wij-beoordelen (plan v4 section 11: one data piece a month for
// links; gap analysis 2026-10-30, change 7). Aggregates over published shops only, never one shop, so no
// shop is singled out. Shown from MIN_SHOPS_FOR_STATS on; small numbers would mislead.
import { scoreDisplay, type PublicShop } from "./present";

export const MIN_SHOPS_FOR_STATS = 20;

type StatShop = Pick<PublicShop, "keurmerk" | "keurmerk_status" | "domain_first_seen" | "has_physical_store" | "score" | "score_label" | "status">;

export type SiteStats = { shops: number; keurmerkPct: number; medianYearsOnline: number | null; storePct: number; score70Pct: number };

const pct = (part: number, all: number) => Math.round((part / all) * 100);

export function siteStats(shops: StatShop[], today: string): SiteStats | null {
  if (shops.length < MIN_SHOPS_FOR_STATS) return null;
  const n = shops.length;
  const year = Number(today.slice(0, 4));
  const years = shops
    .map((s) => (s.domain_first_seen ? year - Number(s.domain_first_seen.slice(0, 4)) : null))
    .filter((y): y is number => y !== null && y >= 0)
    .sort((a, b) => a - b);
  const median = years.length ? years[Math.floor((years.length - 1) / 2)] : null;
  return {
    shops: n,
    keurmerkPct: pct(shops.filter((s) => s.keurmerk_status === "verified" && s.keurmerk.length > 0).length, n),
    medianYearsOnline: median,
    storePct: pct(shops.filter((s) => s.has_physical_store).length, n),
    score70Pct: pct(shops.filter((s) => { const d = scoreDisplay(s); return d.kind === "number" && d.value >= 70; }).length, n),
  };
}

export function statLines(s: SiteStats): string[] {
  return [
    `${s.keurmerkPct}% heeft een keurmerk dat we bij de keurmerkorganisatie hebben bevestigd.`,
    ...(s.medianYearsOnline !== null ? [`De helft is ${s.medianYearsOnline} jaar of langer online.`] : []),
    `${s.storePct}% heeft ook een fysieke winkel of showroom.`,
    `${s.score70Pct}% heeft een echtheidsscore van 70 of hoger.`,
  ];
}
