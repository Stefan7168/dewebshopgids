// Reference draft for gids issue 23 (2027 week 15, theme "lampenkappen uit eigen atelier"),
// with lighting makers from Home lists 2 to 4. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 21.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue23Snapshot: GuideSnapshot = {
  slug: "2027-week-15",
  window: { start: "2027-04-04T22:00:00.000Z", end: "2027-04-11T22:00:00.000Z" },
  shops: [
    shop("s-atelieralma", "atelier-alma", "Atelier Alma", "Verlichting", "Leende", "Lampen, lampenkappen en wandlampen, met de hand gemaakt in het eigen atelier."),
    shop("s-wauw", "wauw-verlichting", "Wauw Verlichting", "Verlichting", "Putten", "Lampenkappen die in het eigen atelier met de hand worden gemaakt, op maat of uit voorraad, plus fittingen en lampen."),
    shop("s-limonada", "studio-limonada", "Studio Limonada", "Verlichting", "Den Haag", "Lampenkappen en lampvoeten met de hand gemaakt in het eigen atelier met winkel."),
    shop("s-oudenr", "oud-en-r-style", "Oud & R Style", "Verlichting", "Arnhem", "Lampenkappen met de hand gemaakt in het eigen atelier, en lampen gemaakt van vintage vazen."),
    shop("s-lampenkappenww", "lampenkappen-webwinkel", "Lampenkappen Webwinkel", "Verlichting", null, "Lampenkappen op maat in veel vormen, gemaakt in een Nederlands atelier, met een online configurator en gratis kleurstalen."),
  ],
};

export const issue23Draft: Draft = {
  title_nl: "Lampenkappen uit eigen atelier",
  intro_nl: "Een nieuwe kap verandert een kamer meer dan je denkt. Deze week vijf ateliers die lampenkappen met de hand maken.",
  body_md: `## Waarom deze vijf

Ze maken hun kappen zelf, vaak op maat. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Atelier Alma, Leende

Lampen, lampenkappen en wandlampen, met de hand gemaakt in het eigen atelier. Ook wandlampen in dezelfde stijl.

[Bekijk Atelier Alma](/webshop/atelier-alma)

## Wauw Verlichting, Putten

Lampenkappen die in het eigen atelier met de hand worden gemaakt, op maat of uit voorraad, plus fittingen en lampen. Alles voor de lamp op een plek.

[Bekijk Wauw Verlichting](/webshop/wauw-verlichting)

## Studio Limonada, Den Haag

Lampenkappen en lampvoeten met de hand gemaakt in het eigen atelier met winkel. Een kap in een stof die je zelf kiest.

[Bekijk Studio Limonada](/webshop/studio-limonada)

## Oud & R Style, Arnhem

Lampenkappen met de hand gemaakt in het eigen atelier, en lampen gemaakt van vintage vazen. Een oude vaas krijgt een nieuw leven als lamp.

[Bekijk Oud & R Style](/webshop/oud-en-r-style)

## Lampenkappen Webwinkel

Lampenkappen op maat in veel vormen, gemaakt in een Nederlands atelier, met een online configurator en gratis kleurstalen. Eerst stalen bekijken, dan bestellen.

[Bekijk Lampenkappen Webwinkel](/webshop/lampenkappen-webwinkel)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-atelieralma", "s-wauw", "s-limonada", "s-oudenr", "s-lampenkappenww"],
};
