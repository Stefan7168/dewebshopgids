// contact_email extractor (plan v3 section 2.3 and 7): role addresses only, on the
// shop's own domain. Anything that may be a person's address is dropped.
const ROLE_LOCALS = [
  "info", "contact", "klantenservice", "service", "support", "hallo", "hello", "hoi",
  "webshop", "shop", "sales", "verkoop", "bestellingen", "orders", "order", "mail",
];

export function extractRoleEmail(html: string, shopDomain: string): string | null {
  const text = html.replace(/&#64;|&commat;|\[at\]|\(at\)/gi, "@");
  const found = [...text.matchAll(/([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})/gi)].map((m) => ({
    local: m[1].toLowerCase(),
    domain: m[2].toLowerCase().replace(/^www\./, ""),
  }));
  const own = found.filter((e) => e.domain === shopDomain || e.domain.endsWith(`.${shopDomain}`));
  // Prefer the order of ROLE_LOCALS (info@ before support@), not page order.
  for (const role of ROLE_LOCALS) {
    const hit = own.find((e) => e.local === role);
    if (hit) return `${hit.local}@${hit.domain}`;
  }
  return null;
}
