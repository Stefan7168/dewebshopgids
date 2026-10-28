// Turn one model answer into verified signals (plan v3 section 7, scoring step 4).
// A true value counts only with a quote that is found on the page it names;
// otherwise the signal is unknown and earns nothing. False values need no quote.
import type { ScoringSignals } from "../../../lib/scoring/compute";
import { redactPersonalData, verifyQuote, type QuoteCheck } from "../../../lib/scoring/quotes";
import type { Focus, OriginClaim } from "../../../lib/scoring/weights";
import { FOCUS_VALUES, ORIGIN_VALUES, pageExcerpt, PAGE_IDS, type CrawlPage, type PageId } from "./prompt";

export type SignalRow = {
  signalKey: string;
  valueBool: boolean | null;
  valueNumeric: number | null;
  evidenceQuote: string | null;
  evidenceUrl: string | null;
  quoteVerified: boolean;
  matchRatio: number | null;
};

export type Profile = {
  priceLevel: number | null;
  hasPhysicalStore: boolean | null;
  storeCity: string | null;
  shipsFromCountry: string | null;
  descriptionNl: string | null;
};

export type ParsedAnswer = {
  rows: SignalRow[];
  signals: ScoringSignals;
  checks: QuoteCheck[];
  profile: Profile;
  instructionsInData: boolean;
};

type Evidence = { value: unknown; quote: unknown; page: unknown };

const BOOL_KEYS = [
  "own_production",
  "brand_owner",
  "has_named_owner",
  "has_address",
  "marketplace_pattern",
  "dropship_indicators",
] as const;

export class ParseError extends Error {}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseAnswer(raw: string, pages: CrawlPage[]): ParsedAnswer {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ParseError("answer is not JSON");
  }
  if (!isObj(data)) throw new ParseError("answer is not an object");

  const pageById = new Map<PageId, CrawlPage>();
  pages.slice(0, PAGE_IDS.length).forEach((p, i) => pageById.set(PAGE_IDS[i], p));

  const rows: SignalRow[] = [];
  const checks: QuoteCheck[] = [];
  const signals: ScoringSignals = {};

  /** Verify a quote on its page. Returns the stored (redacted) quote and url when verified. */
  function check(quote: unknown, page: unknown): { ok: boolean; quote: string | null; url: string | null; ratio: number | null } {
    const p = typeof page === "string" ? pageById.get(page as PageId) : undefined;
    if (typeof quote !== "string" || !p) return { ok: false, quote: null, url: null, ratio: null };
    const c = verifyQuote(quote, pageExcerpt(p.text));
    checks.push(c);
    return { ok: c.verified, quote: c.verified ? redactPersonalData(quote).text : null, url: p.url, ratio: c.ratio };
  }

  for (const key of BOOL_KEYS) {
    const e = data[key] as Evidence | undefined;
    if (!isObj(e) || typeof e.value !== "boolean") throw new ParseError(`${key} missing`);
    if (e.value === false) {
      signals[key] = false;
      rows.push({ signalKey: key, valueBool: false, valueNumeric: null, evidenceQuote: null, evidenceUrl: null, quoteVerified: false, matchRatio: null });
      continue;
    }
    const v = check(e.quote, e.page);
    signals[key] = v.ok ? true : null;
    rows.push({ signalKey: key, valueBool: true, valueNumeric: null, evidenceQuote: v.quote, evidenceUrl: v.url, quoteVerified: v.ok, matchRatio: v.ratio });
  }

  const f = data.focus as Evidence | undefined;
  if (!isObj(f) || !FOCUS_VALUES.includes(f.value as Focus)) throw new ParseError("focus missing");
  const fv = check(f.quote, f.page);
  signals.focus = fv.ok ? (f.value as Focus) : null;
  rows.push({
    signalKey: `focus_${f.value as string}`,
    valueBool: true,
    valueNumeric: null,
    evidenceQuote: fv.quote,
    evidenceUrl: fv.url,
    quoteVerified: fv.ok,
    matchRatio: fv.ratio,
  });

  if (!Array.isArray(data.origin_claims)) throw new ParseError("origin_claims missing");
  const origins = new Set<OriginClaim>();
  for (const c of data.origin_claims) {
    if (!isObj(c) || !ORIGIN_VALUES.includes(c.claim as OriginClaim)) continue;
    const v = check(c.quote, c.page);
    if (v.ok) origins.add(c.claim as OriginClaim);
    rows.push({ signalKey: `origin_${c.claim as string}`, valueBool: true, valueNumeric: null, evidenceQuote: v.quote, evidenceUrl: v.url, quoteVerified: v.ok, matchRatio: v.ratio });
  }
  signals.origin_claims = [...origins];

  const price = Number.isInteger(data.price_level) && (data.price_level as number) >= 1 && (data.price_level as number) <= 4 ? (data.price_level as number) : null;
  const country = typeof data.ships_from_country === "string" && /^[A-Z]{2}$/.test(data.ships_from_country) ? data.ships_from_country : null;
  const city = typeof data.store_city === "string" && data.store_city.length <= 60 ? redactPersonalData(data.store_city).text : null;
  const desc = typeof data.description_nl === "string" ? data.description_nl.trim() : "";
  const descOk = desc.length > 0 && desc.length <= 400 && !/onbetrouwbaar|review/i.test(desc) && !redactPersonalData(desc).redacted;

  return {
    rows,
    signals,
    checks,
    profile: {
      priceLevel: price,
      hasPhysicalStore: typeof data.has_physical_store === "boolean" ? data.has_physical_store : null,
      storeCity: city,
      shipsFromCountry: country,
      descriptionNl: descOk ? desc : null,
    },
    instructionsInData: data.instructions_in_data === true,
  };
}
