import { liveTopics } from "@/lib/beste/topics";
import { getGuides } from "@/lib/guide/data";
import { indexableKeurmerkPages } from "@/lib/keurmerk/pages";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { MIN_SHOPS_TO_INDEX, promotedRoots, shopsInCategory, siteScope } from "@/lib/shops/present";
import { BADGE_MIN_SCORE, badgePriceText } from "@/lib/badge/pricing";
import { SITE } from "@/lib/site";

// llms.txt (https://llmstxt.org): a plain summary for AI crawlers. Low expected value
// (most llms.txt files are never fetched), but it costs nothing and states our method.
export async function GET() {
  const [categories, shops, guides] = await Promise.all([getCategories(), getPublishedShops(), getGuides()]);
  const roots = promotedRoots(categories, shops);
  const rootIds = new Set(roots.map((c) => c.id));
  const listed = categories.filter(
    (c) => rootIds.has(c.parent_id ?? c.id) && shopsInCategory(shops, c, categories).length >= MIN_SHOPS_TO_INDEX,
  );
  const lists = liveTopics(shops, categories).filter((t) => listed.some((c) => c.slug === t.categorySlug));
  const { scope } = siteScope(roots);
  const body = [
    `# ${SITE.name}`,
    "",
    `> Onafhankelijke gids van unieke en betrouwbare Nederlandse webshops voor ${scope}. Elke webshop krijgt een echtheidsscore van 1 tot 100, berekend met een vaste methode uit wat letterlijk op de eigen site staat, plus het aantal producten, de leeftijd van het domein en een gecontroleerd keurmerk.`,
    "",
    "Betaling heeft geen invloed op de score of de volgorde. Webshops kunnen een herbeoordeling of verwijdering aanvragen.",
    "",
    "## Belangrijke pagina's",
    "",
    `- [Over ${SITE.name}](${SITE.url}/over): wie we zijn en hoe de score werkt`,
    `- [Hoe wij beoordelen](${SITE.url}/hoe-wij-beoordelen): de berekening van de echtheidsscore en waar de gegevens vandaan komen`,
    ...listed.map((c) => `- [${c.name_nl}](${SITE.url}/categorie/${c.slug}): webshops gerangschikt op echtheidsscore`),
    ...lists.map((t) => `- [${t.title}](${SITE.url}/beste/webshops-${t.slug}): lijst gerangschikt op echtheidsscore`),
    ...indexableKeurmerkPages(shops).map((p) => `- [Webshops met ${p.name}](${SITE.url}/keurmerk/${p.slug}): keurmerk gecontroleerd bij de keurmerkorganisatie`),
    ...(guides.length ? [`- [De wekelijkse webshopgids](${SITE.url}/gids): elke week 5 webshops uit de gids`] : []),
    "",
    "## Gegevens per webshop",
    "",
    `- ${shops.length} gepubliceerde webshops, elk met een pagina op ${SITE.url}/webshop/[naam]`,
    "- Per webshop: echtheidsscore, geschat aantal producten, online sinds, keurmerk (gecontroleerd of niet), en de zinnen van de eigen site waarop de punten gebaseerd zijn",
    "",
    "## Voor webshops",
    "",
    `- [Badge Geverifieerd](${SITE.url}/geverifieerd): betaalde vermelding voor webshops met een score van ${BADGE_MIN_SCORE} of hoger, ${badgePriceText()}. De badge verandert de score en de volgorde niet en is geen keurmerk.`,
    `- [Informatie voor webshops](${SITE.url}/informatie-voor-webshops): opname is gratis; herbeoordeling, verwijdering en eigen beschrijving`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
