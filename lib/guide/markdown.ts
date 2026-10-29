// The small Markdown subset a gids body may use: "## " headings, paragraphs, **bold** and links
// to our own /webshop/ and /gids/ pages and the info pages in SITE_PAGES. Anything else is plain text. Used for the page and the
// email, so the Editor can never inject HTML or an outside link.
export type Inline = { kind: "text" | "bold"; text: string } | { kind: "link"; text: string; href: string };
export type Block = { kind: "heading" | "paragraph"; inlines: Inline[] };

export const OWN_LINK = /^\/(webshop|gids)\/[a-z0-9-]+$/;

/** Own pages a gids may link to besides this week's shops and other gids issues. */
export const SITE_PAGES = ["/hoe-wij-beoordelen", "/informatie-voor-webshops", "/gids"];

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ kind: "text", text: s.slice(last, m.index) });
    if (m[1] != null) out.push({ kind: "bold", text: m[1] });
    else if (OWN_LINK.test(m[3]) || SITE_PAGES.includes(m[3])) out.push({ kind: "link", text: m[2], href: m[3] });
    else out.push({ kind: "text", text: m[2] }); // outside link: keep the words, drop the link
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ kind: "text", text: s.slice(last) });
  return out;
}

export function parseGuideMarkdown(md: string): Block[] {
  return md
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) =>
      p.startsWith("## ")
        ? { kind: "heading" as const, inlines: parseInline(p.slice(3).replace(/\n/g, " ")) }
        : { kind: "paragraph" as const, inlines: parseInline(p.replace(/\n/g, " ")) },
    );
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML for the email; links become absolute on our own site. */
export function guideHtml(blocks: Block[], siteUrl: string): string {
  const inline = (i: Inline) =>
    i.kind === "bold" ? `<strong>${esc(i.text)}</strong>` : i.kind === "link" ? `<a href="${esc(siteUrl + i.href)}">${esc(i.text)}</a>` : esc(i.text);
  return blocks.map((b) => (b.kind === "heading" ? `<h2>${b.inlines.map(inline).join("")}</h2>` : `<p>${b.inlines.map(inline).join("")}</p>`)).join("\n");
}

export function plainText(blocks: Block[]): string {
  return blocks.map((b) => b.inlines.map((i) => i.text).join("")).join("\n\n");
}
