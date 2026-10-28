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

const ABOUT = /\/(over-?ons|over|about(-us)?|ons-verhaal|wie-zijn-wij|het-atelier|onze-werkplaats|our-story)\/?$/i;
const CONTACT = /\/(contact|klantenservice|contact-?gegevens|customer-service)\/?$/i;

export function pickAboutLink(links: string[]): string | null {
  return links.find((l) => ABOUT.test(new URL(l).pathname)) ?? null;
}

export function pickContactLink(links: string[]): string | null {
  return links.find((l) => CONTACT.test(new URL(l).pathname)) ?? null;
}
