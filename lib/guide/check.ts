// Code-side checks on a gids draft, run by the Fact Checker's tool before it judges the claims.
// A draft with any finding here is rejected; the agent then checks what code cannot (claims,
// tone, names) against the same snapshot.
import type { GuideSnapshot } from "./inputs";
import { parseGuideMarkdown, plainText } from "./markdown";

export const MAX_WORDS = 350;
const BANNED = [/onbetrouwbaar/i, /\breview/i, /advertentie/i, /gesponsord/i, /marketplace_pattern/i, /dropship/i, /aggregaterating/i, /korting/i];

export type Draft = { title_nl: string | null; intro_nl: string | null; body_md: string | null; shop_ids: string[] };

/** Numbers the text may contain: from the snapshot, the week, and a few fixed phrases. */
export function allowedNumbers(s: GuideSnapshot): Set<string> {
  const nums = new Set<string>(["1", "5", "100"]);
  const add = (v: unknown) => {
    for (const n of String(v ?? "").match(/\d+(?:[.,]\d+)?/g) ?? []) nums.add(n);
  };
  const m = s.slug.match(/^(\d{4})-week-(\d{2})$/);
  if (m) [m[1], m[2], String(Number(m[2]))].forEach(add);
  for (const shop of s.shops) {
    add(shop.score);
    if (shop.score_change != null) add(Math.abs(shop.score_change));
    add(shop.online_since);
    add(shop.products);
    add(shop.name);
    add(shop.city);
  }
  return nums;
}

export function checkDraft(d: Draft, s: GuideSnapshot): string[] {
  const findings: string[] = [];
  if (!d.title_nl?.trim()) findings.push("title is empty");
  if (!d.body_md?.trim()) findings.push("body is empty");
  const ids = new Set(s.shops.map((x) => x.id));
  if (d.shop_ids.length === 0 || d.shop_ids.length > 5) findings.push("shop_ids must hold 1 to 5 shops");
  for (const id of d.shop_ids) if (!ids.has(id)) findings.push(`shop ${id} is not in this week's inputs`);

  const text = [d.title_nl ?? "", d.intro_nl ?? "", d.body_md ?? ""].join("\n\n");
  for (const re of BANNED) if (re.test(text)) findings.push(`banned word: ${re.source}`);
  if (/https?:\/\/|www\./i.test(text)) findings.push("outside links are not allowed");
  if (/\/go\//.test(text)) findings.push("links to /go/ are not allowed in the gids");

  const slugs = new Set(s.shops.map((x) => x.slug));
  for (const m of (d.body_md ?? "").matchAll(/\]\(([^)]+)\)/g)) {
    const href = m[1];
    const shop = href.match(/^\/webshop\/([a-z0-9-]+)$/)?.[1];
    if (!(shop ? slugs.has(shop) : /^\/gids\/[a-z0-9-]+$/.test(href))) findings.push(`link ${href} is not one of this week's shops`);
  }

  const allowed = allowedNumbers(s);
  for (const n of new Set(text.match(/\d+(?:[.,]\d+)?/g) ?? [])) if (!allowed.has(n)) findings.push(`number ${n} is not in the inputs`);

  const words = plainText(parseGuideMarkdown(text)).split(/\s+/).filter(Boolean).length;
  if (words > MAX_WORDS) findings.push(`${words} words, max ${MAX_WORDS}`);
  return findings;
}
