// Reference draft for gids issue 15 (2027 week 07, theme "leer uit eigen werkplaats"),
// with shops from Leather bags from Sieraden & accessoires lists. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 13.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue15Snapshot: GuideSnapshot = {
  slug: "2027-week-07",
  window: { start: "2027-02-07T23:00:00.000Z", end: "2027-02-14T23:00:00.000Z" },
  shops: [
    shop("s-lottassen", "lot-tassen", "LOT Tassen", "Tassen & leer", "Lith", "Handtassen, schoudertassen en werktassen uit een eigen klein leeratelier. Je kiest zelf de kleuren."),
    shop("s-sillies", "sillies-leer", "Sillies Leer", "Tassen & leer", "Zwolle", "Leren shoppers, schoudertassen, riemen en sleutelhangers, alles met de hand gemaakt in een eigen leeratelier."),
    shop("s-mutsaers", "mutsaers", "Mutsaers", "Tassen & leer", "Kaatsheuvel", "Leren laptoptassen, aktetassen, rugzakken en portemonnees, met de hand gemaakt in een eigen werkplaats."),
    shop("s-monsak", "monsak", "Monsak", "Tassen & leer", "Amsterdam", "Leren rugzakken en etuis van gered leer, gemaakt in een eigen atelier. Ook tassen op maat en workshops."),
    shop("s-tassenfabriek", "de-tassenfabriek", "De Tassenfabriek", "Tassen & leer", "De Bilt", "Tassen en accessoires uit een eigen atelier, van leer dat overblijft in de tassen- en schoenenindustrie."),
  ],
};

export const issue15Draft: Draft = {
  title_nl: "Leer uit eigen werkplaats: tassen en riemen",
  intro_nl: "Een goede leren tas koop je voor jaren. Deze week vijf leerateliers die hun tassen en riemen zelf maken.",
  body_md: `## Waarom deze vijf

Ze maken hun tassen zelf, in een eigen werkplaats. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## LOT Tassen, Lith

Handtassen, schoudertassen en werktassen uit een eigen klein leeratelier. Je kiest zelf de kleuren. Een tas in je eigen kleurcombinatie.

[Bekijk LOT Tassen](/webshop/lot-tassen)

## Sillies Leer, Zwolle

Leren shoppers, schoudertassen, riemen en sleutelhangers, alles met de hand gemaakt in een eigen leeratelier. Van kleine sleutelhanger tot grote shopper.

[Bekijk Sillies Leer](/webshop/sillies-leer)

## Mutsaers, Kaatsheuvel

Leren laptoptassen, aktetassen, rugzakken en portemonnees, met de hand gemaakt in een eigen werkplaats. Voor wie een tas zoekt voor werk.

[Bekijk Mutsaers](/webshop/mutsaers)

## Monsak, Amsterdam

Leren rugzakken en etuis van gered leer, gemaakt in een eigen atelier. Ook tassen op maat en workshops. Leer dat anders weggegooid was.

[Bekijk Monsak](/webshop/monsak)

## De Tassenfabriek, De Bilt

Tassen en accessoires uit een eigen atelier, van leer dat overblijft in de tassen- en schoenenindustrie. Hergebruikt leer, zelf verwerkt.

[Bekijk De Tassenfabriek](/webshop/de-tassenfabriek)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-lottassen", "s-sillies", "s-mutsaers", "s-monsak", "s-tassenfabriek"],
};
