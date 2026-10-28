// Authenticity score weights (plan v3 section 2.1). The only place weights live.
// Changing a number here is a new SCORE_VERSION; rescoring needs no LLM run.

export const SCORE_VERSION = "v3";

export const MAX_POINTS = {
  maker: 30,
  focus: 20,
  identity: 20,
  scale: 20,
  origin: 10,
} as const;

/** Maker: own production beats own brand. */
export const MAKER_POINTS = { own_production: 30, brand_owner: 20 } as const;

/** Focus: how narrow the assortment is, as judged by the model with a quote. */
export const FOCUS_POINTS = { single_niche: 20, few_related: 12, broad: 4, everything: 0 } as const;
export type Focus = keyof typeof FOCUS_POINTS;
/** Own production gets at least this many focus points: a maker's broad range is still its own work (v2, blind calibration). */
export const MAKER_FOCUS_FLOOR = FOCUS_POINTS.few_related;

/** Identity: booleans only, never the name or address text itself. */
export const IDENTITY_POINTS = { has_named_owner: 7, has_address: 7, has_kvk: 6 } as const;

/**
 * Time online counts modestly, inside Identity and under its cap (v3). It comes from
 * shops.domain_first_seen (WHOIS or Wayback), never from the model. Curation earns nothing:
 * being on our own list must not raise a shop's score.
 */
export const AGE_POINTS = [
  { minYears: 10, points: 4 },
  { minYears: 5, points: 2 },
] as const;

/** Scale: full points under SCALE_FULL_BELOW products, linear to 0 at SCALE_ZERO_AT. */
export const SCALE_FULL_BELOW = 300;
export const SCALE_ZERO_AT = 5000;

/** Origin claims, summed and capped at MAX_POINTS.origin. made_in_eu counts only without made_in_nl. */
export const ORIGIN_POINTS = { handmade: 4, own_atelier: 3, made_in_nl: 3, made_in_eu: 2 } as const;
export type OriginClaim = keyof typeof ORIGIN_POINTS;

/** A verified keurmerk sets a floor under the total, except on a marketplace or dropship pattern (v2). */
export const KEURMERK_FLOOR = 25;

/** A confirmed marketplace or dropship pattern caps Maker and the total. */
export const PATTERN_MAKER_CAP = 5;
export const PATTERN_TOTAL_CAP = 30;

/** Publication bands (plan v3 section 7, scoring step 6). */
export const LABEL_BELOW = 30; // under this: neutral label, no number
export const AUDIT_BAND_MAX = 40; // LABEL_BELOW..AUDIT_BAND_MAX: hidden until the auditor agrees
export const MARKETPLACE_LABEL = "Grote winkel / marktplaats";

/** Fewer valid signals than this keeps a shop in draft (scoring step 4). */
export const MIN_VALID_SIGNALS = 4;
