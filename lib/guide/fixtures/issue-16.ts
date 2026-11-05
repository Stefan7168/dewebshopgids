// Reference draft for gids issue 16 (2027 week 08, theme "bakken en potten voor de tuin"),
// with shops from Garden lists 2 to 4 (Tuin & buiten must be published). Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 13.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue16Snapshot: GuideSnapshot = {
  slug: "2027-week-08",
  window: { start: "2027-02-14T23:00:00.000Z", end: "2027-02-21T23:00:00.000Z" },
  shops: [
    shop("s-hartholt", "hartholt-woodworks", "Hartholt Woodworks", "Potten & plantenbakken", "Esch", "Bloembakken en haagbakken van FSC-hardhout, ook op maat."),
    shop("s-woodworkvoorschoten", "woodwork-voorschoten", "Woodwork Voorschoten", "Potten & plantenbakken", "Voorschoten", "Houten plantenbakken, schermen, pergola's en tuintafels, ontworpen en gemaakt in een eigen timmerwerkplaats."),
    shop("s-betonfabriek", "betonfabriek", "Betonfabriek", "Potten & plantenbakken", "Emmen", "Betonnen plantenbakken, tuinbeelden en buitenkeukens uit een eigen fabriek, zonder tussenhandel."),
    shop("s-cortenstaalwebshop", "cortenstaal-webshop-blumeta", "Cortenstaal Webshop", "Potten & plantenbakken", "Wijchen", "Plantenbakken, randen en hekken van cortenstaal uit eigen productie, ook op maat. Met showroom."),
    shop("s-cortenstaaltuin", "cortenstaaltuin-kramer-staal", "CortenstaalTuin", "Tuinaccessoires", "Winsum", "Kantopsluiting, plantenbakken, houtopslag en verhoogde bakken van cortenstaal uit een eigen werkplaats."),
  ],
};

export const issue16Draft: Draft = {
  title_nl: "Bakken en potten: de tuin klaar voor het voorjaar",
  intro_nl: "Het voorjaar komt eraan. Wie nu bestelt, kan straks planten. Deze week vijf makers van plantenbakken en potten.",
  body_md: `## Waarom deze vijf

Ze maken hun bakken en potten zelf, in een eigen werkplaats of fabriek. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Hartholt Woodworks, Esch

Bloembakken en haagbakken van FSC-hardhout, ook op maat. Hout dat jaren buiten kan staan.

[Bekijk Hartholt Woodworks](/webshop/hartholt-woodworks)

## Woodwork Voorschoten, Voorschoten

Houten plantenbakken, schermen, pergola's en tuintafels, ontworpen en gemaakt in een eigen timmerwerkplaats. Meer dan alleen bakken.

[Bekijk Woodwork Voorschoten](/webshop/woodwork-voorschoten)

## Betonfabriek, Emmen

Betonnen plantenbakken, tuinbeelden en buitenkeukens uit een eigen fabriek, zonder tussenhandel. Zwaar en stevig: beton blijft staan.

[Bekijk Betonfabriek](/webshop/betonfabriek)

## Cortenstaal Webshop, Wijchen

Plantenbakken, randen en hekken van cortenstaal uit eigen productie, ook op maat. Met showroom. Cortenstaal krijgt vanzelf een roestbruine kleur.

[Bekijk Cortenstaal Webshop](/webshop/cortenstaal-webshop-blumeta)

## CortenstaalTuin, Winsum

Kantopsluiting, plantenbakken, houtopslag en verhoogde bakken van cortenstaal uit een eigen werkplaats. Een verhoogde bak voor groente.

[Bekijk CortenstaalTuin](/webshop/cortenstaaltuin-kramer-staal)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-hartholt", "s-woodworkvoorschoten", "s-betonfabriek", "s-cortenstaalwebshop", "s-cortenstaaltuin"],
};
