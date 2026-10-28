// Score maths (plan v3 section 2.1 and section 7, scoring steps 4 to 6).
// Pure: takes signals that already passed quote verification (or came from rules)
// and returns the total, sub-scores, caps and publication band. The model never
// sets the score; it only supplies the signals that reach this function.
import {
  AGE_POINTS,
  AUDIT_BAND_MAX,
  FOCUS_POINTS,
  IDENTITY_POINTS,
  KEURMERK_FLOOR,
  LABEL_BELOW,
  MAKER_FOCUS_FLOOR,
  MAKER_POINTS,
  MARKETPLACE_LABEL,
  MAX_POINTS,
  MIN_VALID_SIGNALS,
  ORIGIN_POINTS,
  PATTERN_MAKER_CAP,
  PATTERN_TOTAL_CAP,
  SCALE_FULL_BELOW,
  SCALE_ZERO_AT,
  SCORE_VERSION,
  type Focus,
  type OriginClaim,
} from "./weights";

/** Undefined or null means unknown: no points, and it does not count as a valid signal. */
export type ScoringSignals = {
  own_production?: boolean | null;
  brand_owner?: boolean | null;
  focus?: Focus | null;
  has_named_owner?: boolean | null;
  has_address?: boolean | null;
  has_kvk?: boolean | null;
  origin_claims?: OriginClaim[] | null;
  marketplace_pattern?: boolean | null;
  dropship_indicators?: boolean | null;
  product_count_est?: number | null;
  keurmerk_verified?: boolean | null;
  /** Whole years since shops.domain_first_seen; measured by code, not a model signal. */
  years_online?: number | null;
};

export type SubScores = Record<keyof typeof MAX_POINTS, number>;

export type Band =
  | { display: "number" }
  | { display: "label"; text: typeof MARKETPLACE_LABEL }
  | { display: "audit_required" };

export type ScoreResult = {
  scoreVersion: string;
  total: number;
  subScores: SubScores;
  capsApplied: string[];
  band: Band;
  validSignals: number;
  /** False keeps the shop in draft: too few valid signals. */
  enoughSignals: boolean;
};

export function scalePoints(count: number | null | undefined): number {
  if (count == null || !Number.isFinite(count) || count < 0) return 0;
  if (count < SCALE_FULL_BELOW) return MAX_POINTS.scale;
  if (count >= SCALE_ZERO_AT) return 0;
  const share = (SCALE_ZERO_AT - count) / (SCALE_ZERO_AT - SCALE_FULL_BELOW);
  return Math.round(MAX_POINTS.scale * share);
}

/** Whole years between domain_first_seen and now; null when unknown. */
export function yearsOnline(
  firstSeen: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!firstSeen) return null;
  const t = new Date(firstSeen).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(
    0,
    Math.floor((now.getTime() - t) / (365.25 * 24 * 3600 * 1000)),
  );
}

export function agePoints(years: number | null | undefined): number {
  if (years == null || !Number.isFinite(years)) return 0;
  return AGE_POINTS.find((a) => years >= a.minYears)?.points ?? 0;
}

function originPoints(claims: OriginClaim[] | null | undefined): number {
  const set = new Set(claims ?? []);
  if (set.has("made_in_nl")) set.delete("made_in_eu");
  let sum = 0;
  for (const c of set) sum += ORIGIN_POINTS[c] ?? 0;
  return Math.min(sum, MAX_POINTS.origin);
}

/** years_online is not a signal from the site, so it does not help a shop out of draft. */
function countValid(s: ScoringSignals): number {
  return Object.entries(s)
    .filter(([k]) => k !== "years_online")
    .map(([, v]) => v)
    .filter(
      (v) =>
        v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0),
    ).length;
}

export function computeScore(s: ScoringSignals): ScoreResult {
  const caps: string[] = [];
  const pattern =
    s.marketplace_pattern === true || s.dropship_indicators === true;

  let maker = s.own_production
    ? MAKER_POINTS.own_production
    : s.brand_owner
      ? MAKER_POINTS.brand_owner
      : 0;
  if (pattern && maker > PATTERN_MAKER_CAP) {
    maker = PATTERN_MAKER_CAP;
    caps.push("pattern_maker_cap");
  }
  const sub: SubScores = {
    maker,
    focus: s.focus
      ? s.own_production
        ? Math.max(FOCUS_POINTS[s.focus], MAKER_FOCUS_FLOOR)
        : FOCUS_POINTS[s.focus]
      : 0,
    identity: Math.min(
      MAX_POINTS.identity,
      (s.has_named_owner ? IDENTITY_POINTS.has_named_owner : 0) +
        (s.has_address ? IDENTITY_POINTS.has_address : 0) +
        (s.has_kvk ? IDENTITY_POINTS.has_kvk : 0) +
        agePoints(s.years_online),
    ),
    scale: scalePoints(s.product_count_est),
    origin: originPoints(s.origin_claims),
  };

  let total = sub.maker + sub.focus + sub.identity + sub.scale + sub.origin;
  if (pattern && total > PATTERN_TOTAL_CAP) {
    total = PATTERN_TOTAL_CAP;
    caps.push("pattern_total_cap");
  }
  // A keurmerk does not lift a marketplace or dropship pattern: bol stays near the plan's anchor of 1.
  if (s.keurmerk_verified && !pattern && total < KEURMERK_FLOOR) {
    total = KEURMERK_FLOOR;
    caps.push("keurmerk_floor");
  }
  total = Math.max(1, Math.min(100, total));

  const band: Band =
    total < LABEL_BELOW || s.marketplace_pattern === true
      ? { display: "label", text: MARKETPLACE_LABEL }
      : total <= AUDIT_BAND_MAX
        ? { display: "audit_required" }
        : { display: "number" };

  const validSignals = countValid(s);
  return {
    scoreVersion: SCORE_VERSION,
    total,
    subScores: sub,
    capsApplied: caps,
    band,
    validSignals,
    enoughSignals: validSignals >= MIN_VALID_SIGNALS,
  };
}
