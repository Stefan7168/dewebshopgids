// Reference draft for gids issue 12 (2027 week 04, theme "wol en linnen voor de koudste weken"),
// with textile shops from the launch list and Home & Living list 2. Same rules as issues 1 to 9.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue12Snapshot: GuideSnapshot = {
  slug: "2027-week-04",
  window: { start: "2027-01-17T23:00:00.000Z", end: "2027-01-24T23:00:00.000Z" },
  shops: [
    shop("s-bymolle", "by-molle", "By Mölle", "Woontextiel", "Dalfsen", "Linnen gordijnen, beddengoed, plaids en kussens, op bestelling met de hand gemaakt onder een eigen label."),
    shop("s-kaatz", "kaatz", "Kaatz", "Woontextiel", "Herpt", "Een eigen lijn wollen kleden en kleden van papiergaren, in elke maat."),
    shop("s-dutchdecor", "dutch-decor", "Dutch Decor", "Woontextiel", null, "Kussens, plaids en spreien van een eigen merk."),
    shop("s-mostdekens", "most-dekens", "MoST Dekens", "Woontextiel", null, "Wollen en merino dekens en plaids van een eigen merk, verzonden vanuit Nederland."),
    shop("s-linnenlabel", "linnen-label", "Linnen Label", "Woontextiel", null, "Een eigen label van Europees linnen: keuken- en tafeltextiel en beddengoed."),
  ],
};

export const issue12Draft: Draft = {
  title_nl: "Wol en linnen voor de koudste weken",
  intro_nl: "Eind januari is vaak de koudste tijd van het jaar. Deze week vijf webshops met eigen plaids, kleden en linnen.",
  body_md: `## Waarom deze vijf

Ze ontwerpen of maken hun eigen collectie. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## By Mölle, Dalfsen

Linnen gordijnen, beddengoed, plaids en kussens, op bestelling met de hand gemaakt onder een eigen label. Linnen dat op maat voor jouw raam of bed wordt gemaakt.

[Bekijk By Mölle](/webshop/by-molle)

## Kaatz, Herpt

Een eigen lijn wollen kleden en kleden van papiergaren, in elke maat. Een wollen kleed maakt een koude vloer meteen warmer.

[Bekijk Kaatz](/webshop/kaatz)

## Dutch Decor

Kussens, plaids en spreien van een eigen merk. Een snelle manier om de bank warmer te maken.

[Bekijk Dutch Decor](/webshop/dutch-decor)

## MoST Dekens

Wollen en merino dekens en plaids van een eigen merk, verzonden vanuit Nederland. Voor wie het 's avonds op de bank warm wil hebben.

[Bekijk MoST Dekens](/webshop/most-dekens)

## Linnen Label

Een eigen label van Europees linnen: keuken- en tafeltextiel en beddengoed. Linnen voor tafel en bed in één stijl.

[Bekijk Linnen Label](/webshop/linnen-label)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-bymolle", "s-kaatz", "s-dutchdecor", "s-mostdekens", "s-linnenlabel"],
};
