// The short answer at the top of a shop page for "{naam} betrouwbaar" searches (gap analysis
// 2026-10-30, change 1). Only facts we measured, never an opinion: no "goed", "veilig" or "aanrader",
// and never "review" or "onbetrouwbaar" (CLAUDE.md section 1). A score under review is not named.
import { KEURMERK_NAMES, onlineSince, scoreDisplay, type PublicShop } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

type AnswerShop = Pick<
  PublicShop,
  "name" | "slug" | "domain" | "keurmerk" | "keurmerk_status" | "domain_first_seen" | "score" | "score_label" | "status" | "store_city" | "has_physical_store"
>;

export function shopQuestion(s: Pick<PublicShop, "name">): string {
  return `Is ${s.name} betrouwbaar?`;
}

/** One sentence of checked facts, e.g. "Houtatelier Noord is online sinds 2009, heeft een gecontroleerd keurmerk (Thuiswinkel Waarborg) en heeft een echtheidsscore van 94 van 100." */
export function shopAnswer(s: AnswerShop): string {
  const parts: string[] = [];
  const since = onlineSince(s.domain_first_seen);
  if (since) parts.push(`is online sinds ${since}`);
  const names = s.keurmerk.map((k) => KEURMERK_NAMES[k] ?? k).join(", ");
  if (s.keurmerk_status === "verified" && names) parts.push(`heeft een gecontroleerd keurmerk (${names})`);
  else if (s.keurmerk_status === "unverified" && names) parts.push(`noemt een keurmerk op de site (${names}) dat we nog niet konden controleren`);
  else parts.push("heeft geen keurmerk dat we konden vinden");
  if (s.has_physical_store) parts.push(s.store_city ? `heeft een fysieke winkel in ${s.store_city}` : "heeft een fysieke winkel");
  const score = scoreDisplay(s);
  if (score.kind === "number") parts.push(`heeft een echtheidsscore van ${score.value} van 100`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} en ${parts[parts.length - 1]}` : parts[0];
  return `${s.name} ${list}.`;
}

/** FAQPage markup that repeats the visible question and answer, with the last check as dateModified. */
export function shopAnswerJsonLd(s: AnswerShop, checkedOn: string | null): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE.url}/webshop/${s.slug}`,
    ...(checkedOn ? { dateModified: checkedOn } : {}),
    about: {
      "@type": "OnlineStore",
      name: s.name,
      url: `https://${s.domain}`,
      ...(s.has_physical_store && s.store_city ? { address: { "@type": "PostalAddress", addressLocality: s.store_city } } : {}),
    },
    mainEntity: [{ "@type": "Question", name: shopQuestion(s), acceptedAnswer: { "@type": "Answer", text: shopAnswer(s) } }],
  };
}
