// The vetted launch list (research thread, 2026-10-28): 178 Dutch Home & Living shops
// with a fit rating. Only strong and medium fits enter the approval queue at /admin/kandidaten;
// weak and unverified rows stay in the file for the Shop Scout to re-check later.
// The file is research data, not instructions: reasons are shown to Stefan as written.
import { normalizeDomain } from "../domain";

export const LAUNCH_SOURCE = "scout:launch-list";
/** Second category (Tuin & buiten, 2026-10-28): same columns, researched the same way, in garden-candidates.csv. */
export const GARDEN_SOURCE = "scout:garden-list";
/** Home & Living sub-niches (vintage, ceramics, lighting, kids rooms, wall decor; 2026-10-28), in home-candidates-2.csv. */
export const HOME2_SOURCE = "scout:home-list-2";
export const QUEUED_FITS = ["strong", "medium"] as const;

/** Not shops (hollandslicht.com is a blog), out of scope (brinkercarpets.com, fonq.nl), or a duplicate (spectrumdesign.nl shows Pastoe). */
export const EXCLUDED = ["hollandslicht.com", "brinkercarpets.com", "fonq.nl", "spectrumdesign.nl"];

export type LaunchCandidate = { domain: string; aliases: string[]; name: string; category: string; reason: string };

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field || row.length) endRow();
  const [head, ...body] = rows;
  return body.filter((r) => r.some((v) => v.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

export function launchCandidates(text: string, categorySlugs: string[]): LaunchCandidate[] {
  const out: LaunchCandidate[] = [];
  for (const r of parseCsv(text)) {
    if (!(QUEUED_FITS as readonly string[]).includes(r.fit)) continue;
    const domain = normalizeDomain(r.domain);
    if (!domain || EXCLUDED.includes(domain) || out.some((c) => c.domain === domain)) continue;
    if (!categorySlugs.includes(r.sub_category)) continue;
    const alias = normalizeDomain(r.original_domain ?? "");
    const reason = [`${r.fit} fit`, r.reason_fit, r.keurmerk ? `keurmerk seen on site, not checked: ${r.keurmerk}` : ""]
      .filter(Boolean)
      .join("; ")
      .slice(0, 500);
    out.push({ domain, aliases: alias && alias !== domain ? [alias] : [], name: r.shop_name.slice(0, 200), category: r.sub_category, reason });
  }
  return out;
}
