// Reference draft for gids issue 8 (week 53, the last issue of the year). The calendar planned
// "the five highest scores of the year", but `guide_inputs` selects new, risen and most clicked
// shops of the week, not a yearly top. So this issue uses the most clicked shops of its window and
// shows their scores with the ranking disclosure. Scores here are test values; the Guide Editor
// gets the real ones from the snapshot.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, score: number, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "veel_bekeken", score_change: null,
});

export const issue8Snapshot: GuideSnapshot = {
  slug: "2026-week-53",
  window: { start: "2026-12-20T23:00:00.000Z", end: "2026-12-27T23:00:00.000Z" },
  shops: [
    shop("s-pastoe", "pastoe", "Pastoe", "Meubels", 88, "Utrecht", "Kasten en meubels uit eigen fabriek."),
    shop("s-montis", "montis", "Montis", "Meubels", 86, null, "Banken en stoelen uit eigen productie."),
    shop("s-arco", "arco", "Arco", "Meubels", 85, null, "Tafels en meubels uit eigen werkplaats."),
    shop("s-harvink", "harvink", "Harvink", "Meubels", 83, null, "Banken en fauteuils onder een eigen merk."),
    shop("s-lensvelt", "lensvelt", "Lensvelt", "Meubels", 81, null, "Meubels van eigen ontwerpers, eigen productie."),
  ],
};

export const issue8Draft: Draft = {
  title_nl: "Vijf webshops die jullie deze week het meest bekeken",
  intro_nl: "De laatste gids van het jaar. Dit zijn de vijf webshops waar lezers de afgelopen week het vaakst op klikten, met hun echtheidsscore.",
  body_md: `## Hoe is deze volgorde bepaald?

We zetten ze op volgorde van echtheidsscore, van hoog naar laag. Betaling heeft geen invloed op de volgorde of de score. Hoe de score werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Pastoe, Utrecht: score 88

Kasten en meubels uit eigen fabriek.

[Bekijk Pastoe](/webshop/pastoe)

## Montis: score 86

Banken en stoelen uit eigen productie.

[Bekijk Montis](/webshop/montis)

## Arco: score 85

Tafels en meubels uit eigen werkplaats.

[Bekijk Arco](/webshop/arco)

## Harvink: score 83

Banken en fauteuils onder een eigen merk.

[Bekijk Harvink](/webshop/harvink)

## Lensvelt: score 81

Meubels van eigen ontwerpers, eigen productie.

[Bekijk Lensvelt](/webshop/lensvelt)

## Meer tips

Alle gidsen van dit jaar staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-pastoe", "s-montis", "s-arco", "s-harvink", "s-lensvelt"],
};
