// Reference draft for gids issue 14 (2027 week 06, theme "sieraden uit eigen atelier"),
// with shops from Jewellery from list 1. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 13.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue14Snapshot: GuideSnapshot = {
  slug: "2027-week-06",
  window: { start: "2027-01-31T23:00:00.000Z", end: "2027-02-07T23:00:00.000Z" },
  shops: [
    shop("s-oogstgoudsmeden", "oogst-goudsmeden", "Oogst Goudsmeden", "Sieraden", "Amsterdam", "Ringen, trouwringen, oorbellen en kettingen, ontworpen en gemaakt in een eigen goudsmidsatelier in de Jordaan. Van de werkbank zo naar de webshop."),
    shop("s-solitudethelabel", "solitude-the-label", "Solitude the Label", "Sieraden", "Amsterdam", "Ringen, kettingen en oorbellen, met de hand gemaakt in een eigen atelier van gerecycled goud en zilver. Bezoek op afspraak."),
    shop("s-zilverzoet", "zilver-zoet", "Zilver & Zoet", "Sieraden", "Voorburg", "Ringen, oorbellen en kettingen in zilver en goud, met de hand gemaakt door een opgeleide goudsmid. Gerecyclede metalen. Atelier aan huis."),
    shop("s-atelieraroha", "atelier-aroha", "Atelier Aroha", "Sieraden", "Eindhoven", "Ringen, trouwringen en kettingen, ontworpen en met de hand gemaakt in een eigen atelier van gerecycled goud. Atelier in het Klokgebouw."),
    shop("s-zandjuweel", "zandjuweel", "Zandjuweel", "Sieraden", "Terschelling", "Sieraden, ontworpen en gemaakt in een eigen atelier op Terschelling. Bezoek op afspraak."),
  ],
};

export const issue14Draft: Draft = {
  title_nl: "Sieraden uit eigen atelier",
  intro_nl: "Een sieraad gaat jaren mee. Deze week vijf goudsmeden en sieradenmakers die alles zelf maken, in een eigen atelier.",
  body_md: `## Waarom deze vijf

Ze ontwerpen en maken hun sieraden zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Oogst Goudsmeden, Amsterdam

Ringen, trouwringen, oorbellen en kettingen, ontworpen en gemaakt in een eigen goudsmidsatelier in de Jordaan. Van de werkbank zo naar de webshop.

[Bekijk Oogst Goudsmeden](/webshop/oogst-goudsmeden)

## Solitude the Label, Amsterdam

Ringen, kettingen en oorbellen, met de hand gemaakt in een eigen atelier van gerecycled goud en zilver. Langskomen in het atelier kan op afspraak.

[Bekijk Solitude the Label](/webshop/solitude-the-label)

## Zilver & Zoet, Voorburg

Ringen, oorbellen en kettingen in zilver en goud, met de hand gemaakt door een opgeleide goudsmid. Gerecyclede metalen. Klein en persoonlijk: een atelier aan huis.

[Bekijk Zilver & Zoet](/webshop/zilver-zoet)

## Atelier Aroha, Eindhoven

Ringen, trouwringen en kettingen, ontworpen en met de hand gemaakt in een eigen atelier van gerecycled goud. Het atelier zit in het Klokgebouw.

[Bekijk Atelier Aroha](/webshop/atelier-aroha)

## Zandjuweel, Terschelling

Sieraden, ontworpen en gemaakt in een eigen atelier op het eiland. Langskomen kan op afspraak.

[Bekijk Zandjuweel](/webshop/zandjuweel)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-oogstgoudsmeden", "s-solitudethelabel", "s-zilverzoet", "s-atelieraroha", "s-zandjuweel"],
};
