// UTM tags on newsletter sign-ups, so ad spend per channel can be attributed. Kept in the
// existing subscribers.source_path as "/path?utm_source=...&utm_medium=...&utm_campaign=..."
// (DECISIONS.md 2026-10-28): no migration needed. Values are campaign names we choose, not
// personal data, and anything else in the URL is dropped.
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const VALUE = /^[a-z0-9._-]{1,50}$/;

/** The three UTM tags from a query string or a stored JSON object; null when none is valid. */
export function parseUtm(input: string | Record<string, unknown> | null | undefined): Utm | null {
  if (!input) return null;
  const get = typeof input === "string" ? (k: string) => new URLSearchParams(input).get(k) : (k: string) => input[k];
  const out: Utm = {};
  for (const k of UTM_KEYS) {
    const v = get(k);
    if (typeof v !== "string") continue;
    const clean = v.trim().toLowerCase().replace(/\s+/g, "-");
    if (VALUE.test(clean)) out[k] = clean;
  }
  return Object.keys(out).length ? out : null;
}

/** The page path with the UTM tags appended, capped at 200 characters like source_path. */
export function sourceWithUtm(path: string, utm: Utm | null): string {
  if (!utm) return path;
  const q = UTM_KEYS.filter((k) => utm[k]).map((k) => `${k}=${utm[k]}`).join("&");
  return `${path}?${q}`.slice(0, 200);
}
