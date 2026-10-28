// Keurmerk badge links and verification (plan v3 section 8, step 5).
// A badge only counts as verified when its certificate page names the shop's domain.
export type Keurmerk = "thuiswinkel" | "webwinkelkeur" | "trusted_shops";

const PATTERNS: [Keurmerk, RegExp][] = [
  ["thuiswinkel", /https?:\/\/(?:www\.)?thuiswinkel\.org\/(?:leden\/[^"'\s<>]+\/certificaat|en\/members\/[^"'\s<>]+\/certificate)\/?/gi],
  ["webwinkelkeur", /https?:\/\/(?:www\.)?webwinkelkeur\.nl\/(?:webshop|leden)\/[^"'\s<>]+/gi],
  ["trusted_shops", /https?:\/\/(?:www\.)?trustedshops\.(?:nl|de|com|eu)\/(?:verkopersbeoordeling\/info_X[A-Z0-9]+\.html|shop\/certificate\.php\?shop_id=X[A-Z0-9]+)/gi],
];

export function findKeurmerkLinks(html: string): { keurmerk: Keurmerk; url: string }[] {
  const out: { keurmerk: Keurmerk; url: string }[] = [];
  for (const [keurmerk, re] of PATTERNS) {
    for (const m of html.matchAll(re)) {
      const url = m[0].replace(/&amp;/g, "&");
      if (!out.some((o) => o.url === url)) out.push({ keurmerk, url });
    }
  }
  return out;
}

/** True when the certificate page text mentions the shop domain (with or without www.). */
export function certificateMentionsDomain(certificateHtml: string, shopDomain: string): boolean {
  const text = certificateHtml.toLowerCase();
  const d = shopDomain.toLowerCase().replace(/^www\./, "");
  const re = new RegExp(`(^|[^a-z0-9.-])(www\\.)?${d.replace(/[.]/g, "\\.")}(?![a-z0-9-]|\\.[a-z0-9])`);
  return re.test(text);
}
