// Platform fingerprints (plan v3 section 8, step 4). Order matters: the first match wins.
export type Platform = "shopify" | "woocommerce" | "lightspeed" | "magento" | "shopware" | "ccvshop" | "other";

const RULES: [Exclude<Platform, "other">, RegExp][] = [
  ["shopify", /cdn\.shopify\.com|Shopify\.theme|\/\/[^"']*myshopify\.com/i],
  ["lightspeed", /cdn\.webshopapp\.com|lightspeedhq|\bseoshop\b/i],
  ["ccvshop", /ccvshop|cdn\.ccv\.eu|\.ccvshop\.nl/i],
  ["shopware", /\/bundles\/storefront\/|shopware/i],
  ["magento", /Magento_[A-Za-z]+\/|\bmage\/cookies\b|data-mage-init|\/static\/version\d+\//i],
  ["woocommerce", /woocommerce|wp-content\/plugins\/woocommerce/i],
];

export function detectPlatform(html: string, headers: Record<string, string> = {}): Platform {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  if (h["x-shopid"] || h["x-shopify-stage"] || /shopify/i.test(h["powered-by"] ?? "")) return "shopify";
  if (/magento/i.test(h["x-magento-tags"] ?? "") || h["x-magento-cache-debug"]) return "magento";
  for (const [platform, re] of RULES) if (re.test(html)) return platform;
  return "other";
}
