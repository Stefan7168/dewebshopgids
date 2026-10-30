// Shop page title and description that answer "{naam} + fact" searches (traffic plan 2026-10-29, item 3):
// keurmerk, years online, the score and where the shop is, from our own data only. Never "review" or
// "onbetrouwbaar" (CLAUDE.md section 1); a score under review is not shown.
import { KEURMERK_NAMES, onlineSince, scoreDisplay, type PublicShop } from "@/lib/shops/present";

type MetaShop = Pick<
  PublicShop,
  "name" | "domain" | "keurmerk" | "keurmerk_status" | "domain_first_seen" | "score" | "score_label" | "status" | "store_city" | "has_physical_store" | "description_nl"
>;

// Google shows about 60 characters but reads the whole title; past 90 the facts stop helping.
export const TITLE_MAX = 90;
export const DESCRIPTION_MAX = 160;
const FALLBACK_TITLE = "echtheidsscore, keurmerk en feiten";

/** Facts in order of search value. Only a keurmerk checked with the issuer counts. */
function facts(s: MetaShop): string[] {
  const out: string[] = [];
  if (s.keurmerk_status === "verified" && s.keurmerk.length) out.push(`keurmerk ${KEURMERK_NAMES[s.keurmerk[0]] ?? s.keurmerk[0]}`);
  const since = onlineSince(s.domain_first_seen);
  if (since) out.push(`online sinds ${since}`);
  const score = scoreDisplay(s);
  if (score.kind === "number") out.push(`echtheidsscore ${score.value}`);
  return out;
}

export function shopTitle(s: MetaShop): string {
  const parts = facts(s);
  // Drop facts from the end until the title fits; a long name keeps at least the fallback.
  while (parts.length) {
    const t = `${s.name}: ${parts.join(", ")}`;
    if (t.length <= TITLE_MAX) return t;
    parts.pop();
  }
  return `${s.name}: ${FALLBACK_TITLE}`;
}

export function shopDescription(s: MetaShop): string {
  const bits: string[] = [];
  const score = scoreDisplay(s);
  if (score.kind === "number") bits.push(`Echtheidsscore ${score.value} van 100.`);
  if (s.keurmerk_status === "verified" && s.keurmerk.length) bits.push(`Keurmerk ${s.keurmerk.map((k) => KEURMERK_NAMES[k] ?? k).join(", ")}, gecontroleerd.`);
  const since = onlineSince(s.domain_first_seen);
  if (since) bits.push(`Online sinds ${since}.`);
  if (s.has_physical_store && s.store_city) bits.push(`Winkel in ${s.store_city}.`);
  const lead = bits.length ? bits.join(" ") : `Echtheidsscore, keurmerk en feiten over ${s.domain}.`;
  const full = s.description_nl ? `${lead} ${s.description_nl}` : lead;
  if (full.length <= DESCRIPTION_MAX) return full;
  const cut = full.slice(0, DESCRIPTION_MAX - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), lead.length))}…`;
}
