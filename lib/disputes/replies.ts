// Dispute reply templates and the slot validator (plan v3 section 7, step 9).
// The Dispute Handler picks a template id and fills typed slots; it never writes the email text.
// Code adds the shop's name and link from the database, validates again and queues the email.
import { SITE } from "../site";

export const FACT_LABELS = {
  online: "Online sinds",
  assortiment: "Assortiment",
  keurmerk: "Keurmerk",
  prijsniveau: "Prijsniveau",
  winkel: "Fysieke winkel",
  verzending: "Verzendt vanuit",
  beschrijving: "Beschrijving",
  score: "Echtheidsscore",
} as const;
export type FactKey = keyof typeof FACT_LABELS;

export type ReplySlots =
  | { template: "dispute_corrected"; corrected_facts: { fact: FactKey; value: string }[] }
  | { template: "dispute_no_change"; checked_facts: FactKey[] }
  | { template: "dispute_in_review"; deadline_date: string };
export type ReplyTemplateId = ReplySlots["template"];
export const REPLY_TEMPLATE_IDS: readonly ReplyTemplateId[] = ["dispute_corrected", "dispute_no_change", "dispute_in_review"];

const MAX_FACTS = 8;
const MAX_VALUE = 120;
/** Internal names that must never reach a shop, also when an agent spells them inside a value. */
const INTERNAL_WORDS = ["marketplace", "dropship", "signal", "sub_score", "subscore", "auditor", "override", "prompt", "pipeline", "llm", "haiku", "claude"];
const BANNED_WORDS = ["onbetrouwbaar", "review"];

/** Null when the value is safe to show a shop; otherwise the reason it is not. */
export function unsafeText(v: string): string | null {
  const lower = v.toLowerCase();
  if (/[\r\n<>]/.test(v)) return "line breaks or angle brackets";
  if (/\b[a-z][a-z0-9]*_[a-z0-9_]+\b/.test(lower)) return "an internal identifier";
  for (const w of INTERNAL_WORDS) if (lower.includes(w)) return `the internal word "${w}"`;
  for (const w of BANNED_WORDS) if (lower.includes(w)) return `the word "${w}"`;
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(lower)) return "an id";
  if (/\S+@\S+\.\S+/.test(v)) return "an email address";
  const site = new URL(SITE.url).hostname;
  for (const m of lower.matchAll(/(?:https?:\/\/|www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})(?:\/\S*)?/g)) {
    const host = m[1].replace(/^www\./, "");
    if (host !== site && !host.endsWith(`.${site}`)) return `a link or domain off ${site}`;
  }
  return null;
}

function isFactKey(v: unknown): v is FactKey {
  return typeof v === "string" && Object.hasOwn(FACT_LABELS, v);
}

export type Validation = { ok: true; slots: ReplySlots } | { ok: false; errors: string[] };

/** Strict: unknown templates, unknown keys, wrong types and unsafe text are all rejected. */
export function validateReplySlots(templateId: unknown, raw: unknown, now = new Date()): Validation {
  const errors: string[] = [];
  if (typeof templateId !== "string" || !(REPLY_TEMPLATE_IDS as readonly string[]).includes(templateId)) return { ok: false, errors: ["unknown template"] };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, errors: ["slots must be an object"] };
  const s = raw as Record<string, unknown>;
  const allowed: Record<ReplyTemplateId, string[]> = {
    dispute_corrected: ["corrected_facts"],
    dispute_no_change: ["checked_facts"],
    dispute_in_review: ["deadline_date"],
  };
  const id = templateId as ReplyTemplateId;
  for (const k of Object.keys(s)) if (!allowed[id].includes(k)) errors.push(`unexpected slot "${k}"`);

  if (id === "dispute_corrected") {
    const list = s.corrected_facts;
    if (!Array.isArray(list) || list.length === 0 || list.length > MAX_FACTS) errors.push(`corrected_facts must hold 1 to ${MAX_FACTS} items`);
    else
      list.forEach((item, i) => {
        const f = item as { fact?: unknown; value?: unknown };
        if (typeof item !== "object" || item === null || Object.keys(item).some((k) => k !== "fact" && k !== "value")) errors.push(`corrected_facts[${i}] has unexpected keys`);
        if (!isFactKey(f?.fact)) errors.push(`corrected_facts[${i}].fact is not a known fact`);
        if (typeof f?.value !== "string" || !f.value.trim() || f.value.length > MAX_VALUE) errors.push(`corrected_facts[${i}].value must be 1 to ${MAX_VALUE} characters`);
        else {
          const why = unsafeText(f.value);
          if (why) errors.push(`corrected_facts[${i}].value contains ${why}`);
        }
      });
    if (errors.length) return { ok: false, errors };
    return { ok: true, slots: { template: id, corrected_facts: (list as { fact: FactKey; value: string }[]).map((f) => ({ fact: f.fact, value: f.value.trim() })) } };
  }

  if (id === "dispute_no_change") {
    const list = s.checked_facts;
    if (!Array.isArray(list) || list.length === 0 || list.length > MAX_FACTS || !list.every(isFactKey)) errors.push(`checked_facts must hold 1 to ${MAX_FACTS} known facts`);
    if (errors.length) return { ok: false, errors };
    return { ok: true, slots: { template: id, checked_facts: [...new Set(list as FactKey[])] } };
  }

  const d = s.deadline_date;
  const days = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? (Date.parse(`${d}T23:59:59Z`) - now.getTime()) / 86_400_000 : NaN;
  if (!(days >= 0 && days <= 60)) errors.push("deadline_date must be a YYYY-MM-DD date within the next 60 days");
  if (errors.length) return { ok: false, errors };
  return { ok: true, slots: { template: id, deadline_date: d as string } };
}

function longDate(ymd: string): string {
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "long" }).format(new Date(`${ymd}T12:00:00Z`));
}

/** The shop name and slug come from the database, never from the agent. */
export function renderReply(slots: ReplySlots, shop: { name: string; slug: string }): { subject: string; text: string } {
  const page = `${SITE.url}/webshop/${shop.slug}`;
  const footer = ["", `Vragen? Antwoord op deze mail of schrijf naar ${SITE.email}.`, "", `${SITE.name} · ${SITE.email}`];
  if (slots.template === "dispute_corrected") {
    return {
      subject: `We hebben de gegevens van ${shop.name} aangepast`,
      text: [
        "Hoi,",
        "",
        `Bedankt voor je melding over ${shop.name}. We hebben het gecontroleerd en deze gegevens aangepast:`,
        "",
        ...slots.corrected_facts.map((f) => `- ${FACT_LABELS[f.fact]}: ${f.value}`),
        "",
        `De pagina wordt binnen een dag bijgewerkt: ${page}`,
        ...footer,
      ].join("\n"),
    };
  }
  if (slots.template === "dispute_no_change") {
    return {
      subject: `We hebben je melding over ${shop.name} bekeken`,
      text: [
        "Hoi,",
        "",
        `Bedankt voor je melding over ${shop.name}. We hebben deze gegevens opnieuw vergeleken met wat op de site van de webshop staat:`,
        "",
        ...slots.checked_facts.map((f) => `- ${FACT_LABELS[f]}`),
        "",
        "We vonden op de site zelf nog geen bron voor een andere waarde, dus deze gegevens blijven voorlopig staan. Staat de juiste informatie op een pagina van de webshop, of heb je een bewijs (bijvoorbeeld een keurmerkcertificaat)? Stuur ons de link of het bestand, dan kijken we opnieuw.",
        "",
        `De pagina: ${page}`,
        ...footer,
      ].join("\n"),
    };
  }
  return {
    subject: `Je melding over ${shop.name} is nog in beoordeling`,
    text: [
      "Hoi,",
      "",
      `Je melding over ${shop.name} is nog in beoordeling. Tot we klaar zijn, tonen we geen score voor deze webshop. Je hoort uiterlijk ${longDate(slots.deadline_date)} van ons.`,
      ...footer,
    ].join("\n"),
  };
}
