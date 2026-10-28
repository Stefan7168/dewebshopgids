// The embeddable "Geverifieerd" badge (plan v3 section 10, `/badge/[slug]`). Plain SVG with no
// scripts or external references, so a shop can show it on its own site as an <img>.
import { SITE } from "../site";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function badgeSvg(score: number | null): string {
  const line = score != null ? `Echtheidsscore ${score} van 100` : SITE.name;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="56" viewBox="0 0 200 56" role="img" aria-label="${esc(`Geverifieerd door ${SITE.name}. ${line}`)}">
<rect x="0.5" y="0.5" width="199" height="55" rx="8" fill="#ffffff" stroke="#171717"/>
<text x="14" y="24" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="700" fill="#171717">Geverifieerd</text>
<text x="14" y="43" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#525252">${esc(score != null ? `${SITE.name} · score ${score}` : SITE.name)}</text>
</svg>`;
}

/** HTML a shop pastes on its site: the badge links to its page in the directory. */
export function badgeEmbed(slug: string): string {
  return `<a href="${SITE.url}/webshop/${slug}"><img src="${SITE.url}/badge/${slug}" width="200" height="56" alt="Geverifieerd door ${SITE.name}"></a>`;
}
