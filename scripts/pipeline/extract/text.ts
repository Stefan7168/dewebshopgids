// HTML to plain text and same-site link discovery for the crawl step.
// Regex based on purpose: the text only feeds the scoring prompt and quote checks.

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", euro: "€", hellip: "…",
  eacute: "é", euml: "ë", iuml: "ï", ouml: "ö", uuml: "ü", agrave: "à", egrave: "è", ccedil: "ç",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article|\/footer|\/header)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\n[\s]*/g, "\n")
    .trim();
}

/** Absolute same-host links in page order, without fragments, deduplicated. */
export function sameSiteLinks(html: string, pageUrl: string): string[] {
  const base = new URL(pageUrl);
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)(?:#[^"']*)?["']/gi)) {
    let u: URL;
    try {
      u = new URL(decodeEntities(m[1]), base);
    } catch {
      continue;
    }
    if (u.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
    if (u.protocol !== "https:" && u.protocol !== "http:") continue;
    u.hash = "";
    const s = u.toString();
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

const EXT = String.raw`(\.html?|\.php)?\/?$`;
const ABOUT = new RegExp(
  String.raw`\/(over-?ons|about(-us)?|ons-verhaal|het-verhaal|wie-zijn-wij|wie-we-zijn|het-atelier|ons-atelier|onze-werkplaats|de-werkplaats|our-story)` + EXT,
  "i",
);
/** "over-mij", "over-studio-x": only used when no ABOUT link exists, as "over-verzending" also matches. */
const ABOUT_LOOSE = new RegExp(String.raw`\/(over|about)-[a-z0-9-]+` + EXT, "i");
const CONTACT = new RegExp(String.raw`\/(contact(-?[a-z0-9-]+)?|klantenservice|customer-service)` + EXT, "i");

/** Tried in order when the home page links no about or contact page (menus built by JavaScript). */
export const ABOUT_FALLBACK_PATHS = ["/over-ons", "/pages/over-ons", "/about-us"] as const;
export const CONTACT_FALLBACK_PATHS = ["/contact", "/pages/contact"] as const;

export function pickAboutLink(links: string[]): string | null {
  const path = (l: string) => new URL(l).pathname;
  return links.find((l) => ABOUT.test(path(l))) ?? links.find((l) => ABOUT_LOOSE.test(path(l)) && !/verzend|retour|bezorg|betaal|cookie|privacy/i.test(path(l))) ?? null;
}

export function pickContactLink(links: string[]): string | null {
  return links.find((l) => CONTACT.test(new URL(l).pathname)) ?? null;
}
