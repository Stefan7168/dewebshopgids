// Code-side rules for Outreach drafts (plan v3 sections 3 and 10). The agent writes the text;
// code decides who may get a mail and checks every draft before it is stored. The payment link and
// the shop page link are placeholders that code fills in at send time, so the agent never handles
// a URL, and code appends the fixed opt-out footer. Prices come from lib/badge/pricing.ts.

import { BADGE_MIN_SCORE, BADGE_PLANS } from "@/lib/badge/pricing";

export const MIN_SCORE = BADGE_MIN_SCORE;
export const COOLDOWN_DAYS = 90;
export const MAX_DRAFTS_PER_RUN = 10;
export const MAX_SUBJECT = 80;
export const MAX_WORDS = 180;
export const PAY_LINK = "[betaallink]";
export const SHOP_LINK = "[shoppagina]";

const BANNED = [
  /onbetrouwbaar/i, /\breview/i, /advertentie/i, /gesponsord/i, /korting/i, /gratis/i, /garantie|gegarandeerd/i,
  /marketplace_pattern/i, /dropship/i,
  // The badge never changes score or order (plan v3 section 10): the mail may not suggest it does.
  /hogere score|score (?:verhogen|omhoog|verbeteren)|hoger in de lijst|bovenaan|betere (?:plek|positie)|ranking/i,
];

export type OutreachCandidate = { id: string; slug: string; name: string; score: number; clicks_30d: number };
export type OutreachDraft = { subject: string; body: string };

export function checkOutreachDraft(d: OutreachDraft, c: OutreachCandidate): string[] {
  const findings: string[] = [];
  const subject = d.subject.trim();
  const body = d.body.trim();
  if (!subject) findings.push("subject is empty");
  if (subject.length > MAX_SUBJECT) findings.push(`subject has ${subject.length} characters, max ${MAX_SUBJECT}`);
  if (!body) findings.push("body is empty");
  const text = `${subject}\n${body}`;
  if (body.split(PAY_LINK).length !== 2) findings.push(`body must contain ${PAY_LINK} exactly once`);
  if (subject.includes("[")) findings.push("placeholders belong in the body, not the subject");
  if (body.split(SHOP_LINK).length > 2) findings.push(`${SHOP_LINK} may appear at most once`);
  const unknown = (body.match(/\[[a-z]+\]/g) ?? []).filter((p) => p !== PAY_LINK && p !== SHOP_LINK);
  if (unknown.length) findings.push(`unknown placeholder(s): ${unknown.join(", ")}`);
  if (/https?:\/\/|www\.|\.nl\b|\.com\b|@/i.test(text)) findings.push("no links, domains or email addresses: use the placeholders");
  for (const re of BANNED) if (re.test(text)) findings.push(`banned wording: ${re.source}`);
  const allowed = new Set([String(c.score), String(c.clicks_30d), ...BADGE_PLANS.map((p) => String(p.eur)), String(MIN_SCORE), "100", "30"]);
  for (const n of new Set(text.match(/\d+(?:[.,]\d+)?/g) ?? [])) if (!allowed.has(n)) findings.push(`number ${n} is not in the data`);
  const words = body.replace(/\[[a-z]+\]/g, "").split(/\s+/).filter(Boolean).length;
  if (words > MAX_WORDS) findings.push(`${words} words, max ${MAX_WORDS}`);
  return findings;
}

/** The text that is mailed: placeholders filled, fixed footer with the opt-out appended. */
export function renderOutreach(body: string, links: { pay: string; shopPage: string }): string {
  return [
    body.trim().replace(PAY_LINK, links.pay).replace(SHOP_LINK, links.shopPage),
    "",
    "--",
    "De Webshopgids, dewebshopgids.nl",
    "Je krijgt deze mail omdat je webshop in De Webshopgids staat. Liever geen mails meer over het de badge? Antwoord met \"stop\", dan mailen we je niet meer.",
  ].join("\n");
}
