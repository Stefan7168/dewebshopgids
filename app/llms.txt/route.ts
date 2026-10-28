import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { MIN_SHOPS_TO_INDEX, promotedRoots, shopsInCategory } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

// llms.txt (https://llmstxt.org): a plain summary for AI crawlers. Low expected value
// (most llms.txt files are never fetched), but it costs nothing and states our method.
export async function GET() {
  const [categories, shops] = await Promise.all([getCategories(), getPublishedShops()]);
  const roots = promotedRoots(categories, shops);
  const rootIds = new Set(roots.map((c) => c.id));
  const listed = categories.filter(
    (c) => rootIds.has(c.parent_id ?? c.id) && shopsInCategory(shops, c, categories).length >= MIN_SHOPS_TO_INDEX,
  );
  const scope = roots.some((c) => c.slug === "tuin-buiten") ? "wonen, interieur en tuin" : "wonen en interieur";
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
    "",
    "## Gegevens per webshop",
    "",
    `- ${shops.length} gepubliceerde webshops, elk met een pagina op ${SITE.url}/webshop/[naam]`,
    "- Per webshop: echtheidsscore, geschat aantal producten, online sinds, keurmerk (gecontroleerd of niet), en de zinnen van de eigen site waarop de punten gebaseerd zijn",
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
