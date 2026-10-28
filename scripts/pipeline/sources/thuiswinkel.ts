// Parsers for the public Thuiswinkel.org member search and certificate pages.
// Only B2C webshop members (/en/members/<slug>/) are imported; B2B members and
// platform sellers are skipped. Page markup is untrusted data: we extract only
// a slug, a name and a website URL, never free text.
import { normalizeDomain } from "../domain";

export const THUISWINKEL_ORIGIN = "https://www.thuiswinkel.org";
export const searchPageUrl = (page: number) =>
  `${THUISWINKEL_ORIGIN}/en/member-search/${page > 1 ? `?page=${page}` : ""}`;
export const certificateUrl = (slug: string) => `${THUISWINKEL_ORIGIN}/en/members/${slug}/certificate/`;

/** Member slugs on one search results page, in order, deduplicated. */
export function parseMemberSearchPage(html: string): { slugs: string[]; hasNext: boolean; page: number | null } {
  const slugs: string[] = [];
  const re = /href="(?:https:\/\/www\.thuiswinkel\.org)?\/en\/members\/([a-z0-9-]+)\/?(?:certificate\/?)?"/g;
  for (const m of html.matchAll(re)) {
    if (!slugs.includes(m[1])) slugs.push(m[1]);
  }
  const pages = [...html.matchAll(/[?&]page=(\d+)/g)].map((m) => Number(m[1]));
  const current = Number(/data-current-page="(\d+)"/.exec(html)?.[1] ?? NaN);
  const maxPage = pages.length ? Math.max(...pages) : null;
  const hasNext = maxPage !== null && (Number.isNaN(current) ? true : maxPage > current);
  return { slugs, hasNext, page: Number.isNaN(current) ? null : current };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

/** Name and website domain from a member certificate page. */
export function parseCertificatePage(html: string): { name: string | null; domain: string | null; websiteUrl: string | null } {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const name = h1 ? stripTags(h1[1]).slice(0, 200) || null : null;

  const label = /Website(?:\s|&nbsp;)*(?:URL)?/i.exec(html);
  let websiteUrl: string | null = null;
  if (label) {
    const after = html.slice(label.index, label.index + 2000);
    for (const m of after.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
      if (!/thuiswinkel\.org/i.test(m[0])) {
        websiteUrl = m[0];
        break;
      }
    }
  }
  return { name, websiteUrl, domain: websiteUrl ? normalizeDomain(websiteUrl) : null };
}
