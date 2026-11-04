// Reference draft for gids issue 25 (2027 week 17, theme "servies uit Nederlandse ateliers voor Koningsdag"),
// with ceramicists from Home lists 2 to 6. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 21.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue25Snapshot: GuideSnapshot = {
  slug: "2027-week-17",
  window: { start: "2027-04-18T22:00:00.000Z", end: "2027-04-25T22:00:00.000Z" },
  shops: [
    shop("s-bam", "bam-keramiek", "BAM Keramiek", "Keuken en tafelen", "Utrecht", "Handgemaakt servies met Nederlandse stadstorens, uit eigen ateliers."),
    shop("s-studiobloei", "studio-bloei", "Studio Bloei", "Keuken en tafelen", "Eindhoven", "Handgemaakte borden, kommen, lampen en kandelaars uit de eigen studio op landgoed Eikenburg."),
    shop("s-pieceofclay", "piece-of-clay", "Piece of Clay", "Keuken en tafelen", "Amersfoort", "Handgemaakt servies (borden, kommen, kopjes), plus plantenpotten en vazen. Elk stuk is met de hand gemaakt."),
    shop("s-salamandre", "la-salamandre", "La Salamandre", "Keuken en tafelen", "Weesp", "Handgemaakte kopjes en mokken van keramiek, plus glas en mozaiek uit de eigen studio. Ook op bestelling."),
    shop("s-lckeramiek", "lc-keramiek", "LC Keramiek", "Keuken en tafelen", "Heiloo", "Handgemaakt servies (kopjes, borden, kommen), vazen en lampen van keramiek."),
  ],
};

export const issue25Draft: Draft = {
  title_nl: "Servies uit Nederlandse ateliers",
  intro_nl: "Koningsdag staat voor de deur. Deze week vijf ateliers die servies in Nederland met de hand maken.",
  body_md: `## Waarom deze vijf

Ze draaien en vormen hun servies zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## BAM Keramiek, Utrecht

Handgemaakt servies met Nederlandse stadstorens, uit eigen ateliers. Een bord met de toren van je eigen stad.

[Bekijk BAM Keramiek](/webshop/bam-keramiek)

## Studio Bloei, Eindhoven

Handgemaakte borden, kommen, lampen en kandelaars uit de eigen studio op landgoed Eikenburg. Servies en licht uit dezelfde studio.

[Bekijk Studio Bloei](/webshop/studio-bloei)

## Piece of Clay, Amersfoort

Handgemaakt servies (borden, kommen, kopjes), plus plantenpotten en vazen. Elk stuk is met de hand gemaakt. Geen twee kopjes zijn gelijk.

[Bekijk Piece of Clay](/webshop/piece-of-clay)

## La Salamandre, Weesp

Handgemaakte kopjes en mokken van keramiek, plus glas en mozaiek uit de eigen studio. Ook op bestelling. Een mok op bestelling kan ook.

[Bekijk La Salamandre](/webshop/la-salamandre)

## LC Keramiek, Heiloo

Handgemaakt servies (kopjes, borden, kommen), vazen en lampen van keramiek. Servies en vazen in dezelfde glazuren.

[Bekijk LC Keramiek](/webshop/lc-keramiek)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-bam", "s-studiobloei", "s-pieceofclay", "s-salamandre", "s-lckeramiek"],
};
