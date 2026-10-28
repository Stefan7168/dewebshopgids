// Product count from sitemaps (plan v3 section 8, step 3). Pure parsing here;
// the crawl step fetches the XML through fetchPolite().

export type ParsedSitemap = { kind: "index" | "urlset" | "unknown"; locs: string[] };

export function parseSitemap(xml: string): ParsedSitemap {
  const kind = /<sitemapindex[\s>]/i.test(xml) ? "index" : /<urlset[\s>]/i.test(xml) ? "urlset" : "unknown";
  const locs = [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi)].map((m) =>
    m[1].replace(/&amp;/g, "&"),
  );
  return { kind, locs };
}

/** Child sitemaps that list products, by the naming conventions of the big platforms. */
export function isProductSitemap(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  return /product/.test(path) && !/categor|product[_-]cat|collection|tag|brand|blog|page/.test(path);
}

/** Product page URLs in a flat urlset, for shops without a product sitemap. */
export function isProductUrl(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  return /\/(products?|produkt|artikel|p)\/[^/]+\/?$/.test(path) || /\.html$/.test(path) && /-\d{3,}\.html$/.test(path);
}

/**
 * Count products given a fetcher for sitemap XML. Returns null when no sitemap
 * yields a count, so the caller can fall back to collection pages.
 */
export async function countProductsFromSitemaps(
  roots: string[],
  getXml: (url: string) => Promise<string | null>,
  maxSitemaps = 50,
): Promise<{ count: number; method: "sitemap" } | null> {
  const seen = new Set<string>();
  const queue = [...roots];
  let productCount = 0;
  let foundProductSitemap = false;
  let flatProductUrls = 0;

  while (queue.length && seen.size < maxSitemaps) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const xml = await getXml(url);
    if (!xml) continue;
    const parsed = parseSitemap(xml);
    if (parsed.kind === "index") {
      const children = parsed.locs.filter((l) => isProductSitemap(l));
      queue.push(...(children.length ? children : parsed.locs));
    } else if (parsed.kind === "urlset") {
      if (isProductSitemap(url)) {
        foundProductSitemap = true;
        productCount += parsed.locs.length;
      } else {
        flatProductUrls += parsed.locs.filter(isProductUrl).length;
      }
    }
  }
  if (foundProductSitemap) return { count: productCount, method: "sitemap" };
  if (flatProductUrls > 0) return { count: flatProductUrls, method: "sitemap" };
  return null;
}
