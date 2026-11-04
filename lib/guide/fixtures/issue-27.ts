// Reference draft for gids issue 27 (2027 week 19, theme "dahlia's en zaden van eigen kwekerij"),
// with growers from Garden lists 1 to 4 (Tuin & buiten must be published). Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 25.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue27Snapshot: GuideSnapshot = {
  slug: "2027-week-19",
  window: { start: "2027-05-02T22:00:00.000Z", end: "2027-05-09T22:00:00.000Z" },
  shops: [
    shop("s-famflowerfarm", "fam-flower-farm", "FAM Flower Farm", "Tuin & buiten", "Lisse", "Dahlia's van de eigen familiekwekerij, plus andere bollen en zaden."),
    shop("s-plukkerz", "plukkerz", "Plukkerz", "Tuin & buiten", "Warnsveld", "Dahliaknollen en stekken van de eigen bloemenkwekerij."),
    shop("s-bolster", "de-bolster", "De Bolster", "Tuin & buiten", "Epe", "Groente-, bloemen- en kruidenzaden, zelf geproduceerd en verpakt."),
    shop("s-bloemenoogst", "bloem-en-oogst", "Bloem en Oogst", "Tuin & buiten", "Wapserveen", "Bloemenzaden van de eigen kwekerij."),
    shop("s-zadenuitzalk", "zaden-uit-zalk", "Zaden uit Zalk", "Tuin & buiten", "Zalk", "Bloemenzaden, met de hand geoogst in de eigen kleine bloementuin."),
  ],
};

export const issue27Draft: Draft = {
  title_nl: "Dahlia's en zaden voor de zomer",
  intro_nl: "Mei is de maand om te zaaien en dahlia's te planten. Deze week vijf kwekers die zelf kweken.",
  body_md: `## Waarom deze vijf

Ze kweken hun knollen en zaden zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## FAM Flower Farm, Lisse

Dahlia's van de eigen familiekwekerij, plus andere bollen en zaden. Veel soorten om uit te kiezen.

[Bekijk FAM Flower Farm](/webshop/fam-flower-farm)

## Plukkerz, Warnsveld

Dahliaknollen en stekken van de eigen bloemenkwekerij. Knollen en stekken uit eigen kwekerij.

[Bekijk Plukkerz](/webshop/plukkerz)

## De Bolster, Epe

Groente-, bloemen- en kruidenzaden, zelf geproduceerd en verpakt. Een moestuin begint met een zakje zaad.

[Bekijk De Bolster](/webshop/de-bolster)

## Bloem en Oogst, Wapserveen

Bloemenzaden van de eigen kwekerij. Snijbloemen uit eigen tuin.

[Bekijk Bloem en Oogst](/webshop/bloem-en-oogst)

## Zaden uit Zalk, Zalk

Bloemenzaden, met de hand geoogst in de eigen kleine bloementuin. Klein en met de hand.

[Bekijk Zaden uit Zalk](/webshop/zaden-uit-zalk)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-famflowerfarm", "s-plukkerz", "s-bolster", "s-bloemenoogst", "s-zadenuitzalk"],
};
