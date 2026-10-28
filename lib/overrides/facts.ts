// Manual fact corrections (migration 0011, DECISIONS 2026-10-28). A person types the corrected
// value in /admin; this file turns it into a typed value for fact_overrides, the shops columns
// the nightly apply-overrides step writes, and the short text for the dispute_corrected reply.
// Pure, so the rules are unit tested.
import { KEURMERK_NAMES, priceLevelText, productCountText } from "../shops/present";

export const OVERRIDE_FACTS = ["online", "assortiment", "keurmerk", "prijsniveau", "winkel", "verzending", "beschrijving"] as const;
export type OverrideFact = (typeof OVERRIDE_FACTS)[number];

export function isOverrideFact(v: unknown): v is OverrideFact {
  return typeof v === "string" && (OVERRIDE_FACTS as readonly string[]).includes(v);
}

export type FactValue = Record<string, unknown>;
export type ParsedFact = { ok: true; value: FactValue; publicValue: string } | { ok: false; error: string };

const KEURMERK_KEYS: Record<string, string> = {
  thuiswinkel: "thuiswinkel", "thuiswinkel waarborg": "thuiswinkel",
  webwinkelkeur: "webwinkelkeur",
  trusted_shops: "trusted_shops", "trusted shops": "trusted_shops",
  other: "other", ander: "other", "ander keurmerk": "other",
};
const PRICE_NAMES = ["voordelig", "middensegment", "hoger segment", "luxe"];

/** Parse what a person typed for one fact. Input is trimmed; errors are in English for /admin. */
export function parseFactInput(fact: OverrideFact, raw: string, thisYear = new Date().getFullYear()): ParsedFact {
  const input = raw.trim();
  switch (fact) {
    case "online": {
      const year = Number(input.match(/^(\d{4})(-\d{2}-\d{2})?$/)?.[1]);
      if (!Number.isInteger(year) || year < 1991 || year > thisYear) return { ok: false, error: "online: give a year like 2015" };
      return { ok: true, value: { year }, publicValue: `sinds ${year}` };
    }
    case "assortiment": {
      if (!/^\d{1,7}$/.test(input)) return { ok: false, error: "assortiment: give a whole number of products" };
      const count = Number(input);
      return { ok: true, value: { count }, publicValue: productCountText(count) ?? `${count} producten` };
    }
    case "keurmerk": {
      if (/^(geen|none)$/i.test(input)) return { ok: true, value: { keurmerk: [] }, publicValue: "geen keurmerk" };
      const keys: string[] = [];
      for (const part of input.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean)) {
        const key = KEURMERK_KEYS[part];
        if (!key) return { ok: false, error: `keurmerk: unknown "${part}"; use thuiswinkel, webwinkelkeur, trusted shops, ander or geen` };
        if (!keys.includes(key)) keys.push(key);
      }
      if (keys.length === 0) return { ok: false, error: "keurmerk: empty" };
      return { ok: true, value: { keurmerk: keys }, publicValue: keys.map((k) => KEURMERK_NAMES[k]).join(", ") };
    }
    case "prijsniveau": {
      const byName = PRICE_NAMES.indexOf(input.toLowerCase()) + 1;
      const level = /^[1-4]$/.test(input) ? Number(input) : byName;
      if (level < 1) return { ok: false, error: "prijsniveau: 1 to 4, or voordelig, middensegment, hoger segment, luxe" };
      return { ok: true, value: { level }, publicValue: priceLevelText(level)!.toLowerCase() };
    }
    case "winkel": {
      if (/^(nee|geen|no)$/i.test(input)) return { ok: true, value: { store: false, city: null }, publicValue: "geen fysieke winkel" };
      if (!/^[\p{L}][\p{L} .'-]{1,59}$/u.test(input)) return { ok: false, error: "winkel: give the city, or nee" };
      return { ok: true, value: { store: true, city: input }, publicValue: `winkel in ${input}` };
    }
    case "verzending": {
      const country = input.toUpperCase();
      if (!/^[A-Z]{2}$/.test(country)) return { ok: false, error: "verzending: two-letter country code like NL" };
      return { ok: true, value: { country }, publicValue: `verzendt vanuit ${country}` };
    }
    case "beschrijving": {
      const text = input.replace(/\s+/g, " ");
      if (text.length < 20 || text.length > 600) return { ok: false, error: "beschrijving: 20 to 600 characters" };
      return { ok: true, value: { text }, publicValue: "beschrijving aangepast" };
    }
  }
}

/** The shops columns a stored correction sets. Throws on a value this code did not write. */
export function factColumns(fact: OverrideFact, v: FactValue): Record<string, unknown> {
  const need = (ok: boolean) => {
    if (!ok) throw new Error(`invalid ${fact} value ${JSON.stringify(v)}`);
  };
  switch (fact) {
    case "online":
      need(Number.isInteger(v.year));
      return { domain_first_seen: `${v.year}-01-01`, domain_age_sources: { manual: true, year: v.year, agree: true } };
    case "assortiment":
      need(Number.isInteger(v.count) && (v.count as number) >= 0);
      return { product_count_est: v.count, product_count_method: "manual" };
    case "keurmerk": {
      need(Array.isArray(v.keurmerk));
      const list = v.keurmerk as string[];
      return { keurmerk: list, keurmerk_status: list.length ? "verified" : "none", keurmerk_verified_method: list.length ? "manual" : null };
    }
    case "prijsniveau":
      need(Number.isInteger(v.level));
      return { price_level: v.level };
    case "winkel":
      need(typeof v.store === "boolean");
      return { has_physical_store: v.store, store_city: v.store ? v.city : null };
    case "verzending":
      need(typeof v.country === "string");
      return { ships_from_country: v.country };
    case "beschrijving":
      need(typeof v.text === "string");
      return { description_nl: v.text };
  }
}
