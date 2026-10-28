// Pure presentation rules for public shop data (plan v3 sections 2 and 7).
// No database access here, so the rules are unit tested.
import {
  AUDIT_BAND_MAX,
  FOCUS_POINTS,
  IDENTITY_POINTS,
  KEURMERK_FLOOR,
  LABEL_BELOW,
  MARKETPLACE_LABEL,
  MAX_POINTS,
  ORIGIN_POINTS,
  PATTERN_TOTAL_CAP,
  SCALE_FULL_BELOW,
  SCALE_ZERO_AT,
} from "@/lib/scoring/weights";

/** Columns of the `shops_public` view. */
export type PublicShop = {
  id: string;
  slug: string;
  name: string;
  domain: string;
  category_id: string | null;
  platform: string | null;
  product_count_est: number | null;
  domain_first_seen: string | null;
  keurmerk: string[];
  keurmerk_status: "none" | "unverified" | "verified";
  affiliate_available: boolean;
  price_level: number | null;
  has_physical_store: boolean | null;
  store_city: string | null;
  ships_from_country: string | null;
  score: number | null;
  score_version: string | null;
  score_label: string | null;
  description_nl: string | null;
  verified_badge_until: string | null;
  updated_at: string;
  /** `disputed` shows "In beoordeling" instead of the score (migration 0008). */
  status: "published" | "disputed";
};

export type Category = {
  id: string;
  slug: string;
  name_nl: string;
  parent_id: string | null;
  intro_nl: string | null;
  seo_title: string | null;
  sort_order: number;
};

export type ScoreDisplay =
  | { kind: "number"; value: number }
  | { kind: "label"; text: string }
  | { kind: "pending" }
  | { kind: "none" };

/**
 * Under LABEL_BELOW (or a marketplace pattern) the pipeline stores a neutral label;
 * LABEL_BELOW..AUDIT_BAND_MAX stores `audit_required` and shows no number until the
 * auditor agrees (the publish job clears the label then).
 */
export function scoreDisplay(s: Pick<PublicShop, "score" | "score_label"> & { status?: PublicShop["status"] }): ScoreDisplay {
  if (s.status === "disputed" || s.score_label === "audit_required") return { kind: "pending" };
  if (s.score_label) return { kind: "label", text: s.score_label };
  if (s.score == null) return { kind: "none" };
  return { kind: "number", value: s.score };
}

/** Plan v3 section 9: category pages with fewer shops stay out of the index and the sitemap. */
export const MIN_SHOPS_TO_INDEX = 5;

/** A main category other than the launch one (Wonen) shows on the home page, the header and llms.txt only from this many shops. */
export const MIN_SHOPS_TO_PROMOTE = 30;
export const LAUNCH_ROOT_SLUG = "wonen";

/** Main categories to promote: Wonen always, others once they have MIN_SHOPS_TO_PROMOTE published shops. Their pages stay reachable either way. */
export function promotedRoots<T extends Pick<PublicShop, "category_id">>(categories: Category[], shops: T[]): Category[] {
  return categories.filter(
    (c) => c.parent_id === null && (c.slug === LAUNCH_ROOT_SLUG || shopsInCategory(shops, c, categories).length >= MIN_SHOPS_TO_PROMOTE),
  );
}

const RANK_ORDER: Record<ScoreDisplay["kind"], number> = { number: 0, pending: 1, label: 2, none: 3 };

/** Numbered shops by score, high to low; then the rest. Ties and the rest by name. */
export function rankShops<T extends Pick<PublicShop, "score" | "score_label" | "name"> & { status?: PublicShop["status"] }>(shops: T[]): T[] {
  return [...shops].sort((a, b) => {
    const da = scoreDisplay(a);
    const db = scoreDisplay(b);
    if (da.kind !== db.kind) return RANK_ORDER[da.kind] - RANK_ORDER[db.kind];
    if (da.kind === "number" && db.kind === "number" && da.value !== db.value) return db.value - da.value;
    return a.name.localeCompare(b.name, "nl");
  });
}

/** Shops in this category or any of its direct sub-categories. */
export function shopsInCategory<T extends Pick<PublicShop, "category_id">>(shops: T[], category: Category, all: Category[]): T[] {
  const ids = new Set([category.id, ...all.filter((c) => c.parent_id === category.id).map((c) => c.id)]);
  return shops.filter((s) => s.category_id != null && ids.has(s.category_id));
}

export const KEURMERK_NAMES: Record<string, string> = {
  thuiswinkel: "Thuiswinkel Waarborg",
  webwinkelkeur: "WebwinkelKeur",
  trusted_shops: "Trusted Shops",
  other: "Ander keurmerk",
};

export function keurmerkText(s: Pick<PublicShop, "keurmerk" | "keurmerk_status">): string {
  const names = s.keurmerk.map((k) => KEURMERK_NAMES[k] ?? k).join(", ");
  if (s.keurmerk_status === "verified" && names) return `${names} (gecontroleerd bij de keurmerkorganisatie)`;
  if (s.keurmerk_status === "unverified" && names) return `${names} (vermeld op de site, nog niet gecontroleerd)`;
  return "Geen keurmerk gevonden";
}

export function onlineSince(domainFirstSeen: string | null): string | null {
  if (!domainFirstSeen) return null;
  const year = Number(domainFirstSeen.slice(0, 4));
  return Number.isInteger(year) && year > 1990 ? String(year) : null;
}

export function productCountText(n: number | null): string | null {
  if (n == null) return null;
  if (n < 50) return "Minder dan 50 producten";
  const rounded = n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
  return `Ongeveer ${rounded.toLocaleString("nl-NL")} producten`;
}

export const SUB_SCORE_NAMES: Record<keyof typeof MAX_POINTS, string> = {
  maker: "Maker of eigen merk",
  focus: "Focus van het assortiment",
  identity: "Wie zit erachter",
  scale: "Kleinschaligheid",
  origin: "Herkomst",
};

/** The ranking disclosure (art. 6:193e lid 2 BW), built from the live weights so it cannot drift. */
export function rankingExplanation(): string[] {
  return [
    "De volgorde is de echtheidsscore van 1 tot 100, van hoog naar laag. Bij gelijke score staat de naam op alfabet.",
    `De score telt vijf onderdelen op: ${SUB_SCORE_NAMES.maker.toLowerCase()} (max ${MAX_POINTS.maker}), ${SUB_SCORE_NAMES.focus.toLowerCase()} (max ${MAX_POINTS.focus}), ${SUB_SCORE_NAMES.identity.toLowerCase()} (max ${MAX_POINTS.identity}: eigenaar ${IDENTITY_POINTS.has_named_owner}, adres ${IDENTITY_POINTS.has_address}, KvK ${IDENTITY_POINTS.has_kvk}), ${SUB_SCORE_NAMES.scale.toLowerCase()} (max ${MAX_POINTS.scale}: volle punten onder ${SCALE_FULL_BELOW} producten, 0 vanaf ${SCALE_ZERO_AT}) en ${SUB_SCORE_NAMES.origin.toLowerCase()} (max ${MAX_POINTS.origin}).`,
    `Focus: één niche ${FOCUS_POINTS.single_niche}, een paar verwante productgroepen ${FOCUS_POINTS.few_related}, breed ${FOCUS_POINTS.broad}. Herkomst: handgemaakt ${ORIGIN_POINTS.handmade}, eigen atelier ${ORIGIN_POINTS.own_atelier}, gemaakt in Nederland ${ORIGIN_POINTS.made_in_nl}, gemaakt in de EU ${ORIGIN_POINTS.made_in_eu}.`,
    `Een gecontroleerd keurmerk geeft minimaal ${KEURMERK_FLOOR} punten. Een shop met kenmerken van een marktplaats of dropshipping krijgt hoogstens ${PATTERN_TOTAL_CAP} punten.`,
    `Onder ${LABEL_BELOW} punten tonen we het label "${MARKETPLACE_LABEL}" in plaats van een getal. Scores van ${LABEL_BELOW} tot en met ${AUDIT_BAND_MAX} tonen we pas na een tweede controle; tot die tijd staat er "In beoordeling". Die shops staan onder de shops met een getal.`,
    "Elk punt is gebaseerd op een zin die letterlijk op de site van de webshop staat, of op een meting zoals het aantal producten.",
    "Betaling heeft geen invloed op de volgorde.",
  ];
}

export function priceLevelText(level: number | null): string | null {
  if (level == null || level < 1 || level > 4) return null;
  return ["Voordelig", "Middensegment", "Hoger segment", "Luxe"][level - 1];
}

/** "NL" becomes "Nederland". Unknown or malformed codes return null so the fact is hidden. */
export function countryName(code: string | null): string | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  const name = new Intl.DisplayNames(["nl"], { type: "region" }).of(code.toUpperCase());
  return name && name !== code.toUpperCase() ? name : null;
}

/** The paid "Geverifieerd" badge is active through `verified_badge_until` (a date, inclusive). */
export function hasVerifiedBadge(s: Pick<PublicShop, "verified_badge_until">, today = new Date().toISOString().slice(0, 10)): boolean {
  return s.verified_badge_until != null && s.verified_badge_until >= today;
}
