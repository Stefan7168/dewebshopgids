// Which stored signals may appear as evidence on a shop page (CLAUDE.md section 4).
// Only verified quotes, only for points earned, never the negative inferences.
import type { MAX_POINTS } from "@/lib/scoring/weights";

export type SubScoreKey = keyof typeof MAX_POINTS;
export type SignalRow = { signal_key: string; value_bool: boolean | null; evidence_quote: string | null; evidence_url: string | null; quote_verified: boolean };
export type Evidence = { quote: string; url: string | null };
export type EarnedSubScore = { key: SubScoreKey; points: number; max: number; evidence: Evidence[] };

/** Signal key to sub-score. marketplace_pattern and dropship_indicators are deliberately absent. */
export function subScoreFor(signalKey: string): SubScoreKey | null {
  if (signalKey === "own_production" || signalKey === "brand_owner") return "maker";
  if (signalKey === "has_named_owner" || signalKey === "has_address") return "identity";
  if (/^focus_(single_niche|few_related|broad)$/.test(signalKey)) return "focus";
  if (/^origin_(handmade|own_atelier|made_in_nl|made_in_eu)$/.test(signalKey)) return "origin";
  return null;
}

/** Only http(s) links are rendered: the url came from a crawl, so it is untrusted. */
function webUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

const ORDER: SubScoreKey[] = ["maker", "focus", "identity", "scale", "origin"];

/**
 * Earned sub-scores with their quotes. A sub-score that rests on quotes (maker, focus, origin)
 * is shown only when it has at least one verified quote; identity and scale may also come
 * from rule facts (KvK number, product count) and are shown on points alone.
 */
export function earnedSubScores(subScores: Record<string, unknown>, max: Record<SubScoreKey, number>, signals: SignalRow[]): EarnedSubScore[] {
  const byKey = new Map<SubScoreKey, Evidence[]>();
  const seen = new Set<string>();
  for (const s of signals) {
    const key = subScoreFor(s.signal_key);
    if (!key || s.value_bool !== true || !s.quote_verified || !s.evidence_quote) continue;
    const quote = s.evidence_quote.trim();
    if (!quote || seen.has(quote)) continue;
    seen.add(quote);
    byKey.set(key, [...(byKey.get(key) ?? []), { quote, url: webUrl(s.evidence_url) }]);
  }
  const out: EarnedSubScore[] = [];
  for (const key of ORDER) {
    const points = Number(subScores[key]);
    if (!Number.isFinite(points) || points <= 0) continue;
    const evidence = byKey.get(key) ?? [];
    if (evidence.length === 0 && key !== "identity" && key !== "scale") continue;
    out.push({ key, points, max: max[key], evidence });
  }
  return out;
}
