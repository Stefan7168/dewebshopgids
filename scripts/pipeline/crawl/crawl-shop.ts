// Crawl one shop and run the rule extractors (plan v3 section 7 step 1, section 8 steps 3 to 5).
// Fetches home, about, contact and up to 3 product pages through fetchPolite(),
// then derives deterministic facts. No database access: crawl/run-crawl.ts stores the result.
import { certificateMentionsDomain, findKeurmerkLinks, type Keurmerk } from "../extract/keurmerk";
import { extractRoleEmail } from "../extract/contact-email";
import { hasKvkNumber } from "../extract/kvk";
import { detectPlatform, type Platform } from "../extract/platform";
import { countProductsFromSitemaps, isProductUrl } from "../extract/sitemap";
import { htmlToText, pickAboutLink, pickContactLink, sameSiteLinks } from "../extract/text";
import type { PoliteResult } from "../fetch-polite";

export const MAX_PRODUCT_PAGES = 3;
export const MAX_TEXT_CHARS = 20_000;

export type PageType = "home" | "about" | "contact" | "product" | "keurmerk_certificate";

export type CrawledPage = {
  url: string;
  pageType: PageType;
  statusCode: number | null;
  robotsAllowed: boolean;
  text: string | null;
};

export type CrawlResult =
  | { ok: false; error: string; pages: CrawledPage[] }
  | {
      ok: true;
      pages: CrawledPage[];
      platform: Platform;
      productCount: { count: number; method: "sitemap" } | null;
      hasKvk: boolean;
      contactEmail: string | null;
      keurmerk: Keurmerk[];
      keurmerkStatus: "none" | "unverified" | "verified";
      fetchErrors: number;
    };

type Fetch = (url: string) => Promise<PoliteResult>;

function toPage(r: PoliteResult, pageType: PageType): CrawledPage {
  if (r.kind === "ok") {
    const isHtml = /html|xml|text/i.test(r.contentType);
    return {
      url: r.url,
      pageType,
      statusCode: r.status,
      robotsAllowed: true,
      text: r.status === 200 && isHtml ? htmlToText(r.text).slice(0, MAX_TEXT_CHARS) : null,
    };
  }
  return { url: r.url, pageType, statusCode: null, robotsAllowed: r.kind !== "robots_disallowed", text: null };
}

export async function crawlShop(fetchPolite: Fetch, domain: string): Promise<CrawlResult> {
  const homeUrl = `https://${domain}/`;
  const home = await fetchPolite(homeUrl);
  const pages: CrawledPage[] = [toPage(home, "home")];
  if (home.kind !== "ok" || home.status !== 200) {
    return { ok: false, error: home.kind === "ok" ? `home status ${home.status}` : home.kind, pages };
  }

  const htmlByUrl = new Map<string, string>([[homeUrl, home.text]]);
  let fetchErrors = 0;
  const links = sameSiteLinks(home.text, home.finalUrl);
  const targets: [string | null, PageType][] = [
    [pickAboutLink(links), "about"],
    [pickContactLink(links), "contact"],
    ...links.filter(isProductUrl).slice(0, MAX_PRODUCT_PAGES).map((u) => [u, "product"] as [string, PageType]),
  ];
  for (const [url, type] of targets) {
    if (!url) continue;
    const r = await fetchPolite(url);
    pages.push(toPage(r, type));
    if (r.kind === "ok" && r.status === 200) htmlByUrl.set(url, r.text);
    else if (r.kind !== "robots_disallowed") fetchErrors++;
  }

  const productCount = await countProductsFromSitemaps(
    [`https://${domain}/sitemap.xml`],
    async (u) => {
      const r = await fetchPolite(u);
      return r.kind === "ok" && r.status === 200 ? r.text : null;
    },
    10,
  );

  const allHtml = [...htmlByUrl.values()];
  const allText = pages.flatMap((p) => (p.text ? [p.text] : []));
  const contactEmail = allHtml.map((h) => extractRoleEmail(h, domain)).find((e) => e !== null) ?? null;

  // Keurmerk: a badge link counts as verified only when its certificate page names the domain.
  const badges = findKeurmerkLinks(home.text);
  const keurmerk: Keurmerk[] = [];
  let verified = false;
  for (const b of badges) {
    if (!keurmerk.includes(b.keurmerk)) keurmerk.push(b.keurmerk);
    const cert = await fetchPolite(b.url);
    pages.push(toPage(cert, "keurmerk_certificate"));
    if (cert.kind === "ok" && cert.status === 200 && certificateMentionsDomain(cert.text, domain)) verified = true;
  }

  return {
    ok: true,
    pages,
    platform: detectPlatform(home.text),
    productCount,
    hasKvk: allText.some(hasKvkNumber),
    contactEmail,
    keurmerk,
    keurmerkStatus: badges.length === 0 ? "none" : verified ? "verified" : "unverified",
    fetchErrors,
  };
}
