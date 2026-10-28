// Evidence quote verification (plan v3 section 7, scoring step 4).
// A quote counts only if it appears on the crawled page: after normalisation,
// the best-matching substring of the page has a Levenshtein ratio above 0.95.
// Personal names and street addresses are redacted before a quote is stored.

export const MATCH_THRESHOLD = 0.95;
export const MAX_QUOTE_CHARS = 300;
/** A run with a lower share of verified quotes fails (scoring step 4). */
export const MIN_RUN_MATCH_RATE = 0.8;

const QUOTE_VARIANTS: [RegExp, string][] = [
  [/[‘’‚‛′`´]/g, "'"],
  [/[“”„‟″«»]/g, '"'],
  [/[‐-―−]/g, "-"],
  [/…/g, "..."],
];

export function normalizeText(text: string): string {
  let t = text.normalize("NFKC").replace(/[­​-‍⁠﻿]/g, "");
  for (const [re, to] of QUOTE_VARIANTS) t = t.replace(re, to);
  return t.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Smallest edit distance between `needle` and any substring of `hay`
 * (Sellers' approximate substring match). O(len(needle) * len(hay)) time, O(len(needle)) memory.
 */
export function bestSubstringDistance(needle: string, hay: string): number {
  const m = needle.length;
  if (m === 0) return 0;
  let prev = new Array<number>(m + 1);
  let cur = new Array<number>(m + 1);
  for (let i = 0; i <= m; i++) prev[i] = i;
  let best = prev[m];
  for (let j = 1; j <= hay.length; j++) {
    cur[0] = 0; // a match may start anywhere in hay
    const hc = hay.charCodeAt(j - 1);
    for (let i = 1; i <= m; i++) {
      const cost = needle.charCodeAt(i - 1) === hc ? 0 : 1;
      cur[i] = Math.min(prev[i] + 1, cur[i - 1] + 1, prev[i - 1] + cost);
    }
    if (cur[m] < best) best = cur[m];
    [prev, cur] = [cur, prev];
  }
  return best;
}

export type QuoteCheck = { verified: boolean; ratio: number };

export function verifyQuote(quote: string, pageText: string): QuoteCheck {
  const q = normalizeText(quote);
  if (q.length < 8 || q.length > MAX_QUOTE_CHARS) return { verified: false, ratio: 0 };
  const page = normalizeText(pageText);
  if (page.includes(q)) return { verified: true, ratio: 1 };
  const ratio = Math.max(0, 1 - bestSubstringDistance(q, page) / q.length);
  return { verified: ratio > MATCH_THRESHOLD, ratio: Math.round(ratio * 1000) / 1000 };
}

// Words that introduce a person's name in Dutch and English shop copy.
// The intro is case-insensitive at its first letter; the name itself must be capitalised.
const INTROS = [
  "hoi,? ik ben", "hallo,? ik ben", "ik ben", "ik heet", "mijn naam is", "wij zijn", "opgericht door",
  "gestart door", "eigenaresse", "eigenaar", "oprichtster", "oprichter", "founder", "my name is", "i am", "i'm",
];
const intro = INTROS.map((w) => `[${w[0].toUpperCase()}${w[0]}]${w.slice(1)}`).join("|");
const NAME_INTRO = new RegExp(
  `\\b(${intro})(\\s*[:,-]?\\s+)((?:[A-Z\\u00C0-\\u00DE][\\p{Ll}'-]+)(?:\\s+(?:en|&|and|van|de|der|den|ter|ten)?\\s*[A-Z\\u00C0-\\u00DE][\\p{Ll}'-]+)*)`,
  "gu",
);
const POSTCODE = /\b\d{4}\s?[A-Z]{2}\b/g;
const STREET =
  /\b[A-ZÀ-Þ][\p{Ll}-]*(?:straat|weg|laan|plein|gracht|kade|dijk|singel|steeg|hof|pad|dreef|markt)\s+\d+\s?[a-zA-Z]?\b/gu;

/** Replace personal names and street addresses with placeholders. */
export function redactPersonalData(quote: string): { text: string; redacted: boolean } {
  let redacted = false;
  const text = quote
    .replace(NAME_INTRO, (_m, intro: string, sep: string) => {
      redacted = true;
      return `${intro}${sep}[naam]`;
    })
    .replace(STREET, () => {
      redacted = true;
      return "[adres]";
    })
    .replace(POSTCODE, () => {
      redacted = true;
      return "[postcode]";
    });
  return { text, redacted };
}

/** Share of verified quotes in a run; 1 when there were none to check. */
export function matchRate(checks: QuoteCheck[]): number {
  if (checks.length === 0) return 1;
  return checks.filter((c) => c.verified).length / checks.length;
}
