// Reference draft for gids issue 13 (2027 week 05, theme "chocolade van makers, op tijd voor Valentijn"),
// with chocolate makers from Eten & drinken list 1. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 9.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue13Snapshot: GuideSnapshot = {
  slug: "2027-week-05",
  window: { start: "2027-01-24T23:00:00.000Z", end: "2027-01-31T23:00:00.000Z" },
  shops: [
    shop("s-puccinibomboni", "puccini-bomboni", "Puccini Bomboni", "Chocolade & koek", "Amsterdam", "Bonbons en chocolade uit een eigen chocolademakerij."),
    shop("s-chocolatemakers", "chocolatemakers", "Chocolatemakers", "Chocolade & koek", "Amsterdam", "Elke reep wordt in een eigen fabriek gebrand, gemalen en gegoten. Biologisch."),
    shop("s-debontekoe", "de-bonte-koe", "De Bonte Koe", "Chocolade & koek", "Schiedam", "Handgemaakte repen, bonbons en truffels."),
    shop("s-chocolateplanet", "chocolate-planet", "Chocolate Planet", "Chocolade & koek", "Hoogkarspel", "Bonbons, met de hand gemaakt in een eigen atelier, plus proeverijdozen."),
    shop("s-krakchocolade", "krak-chocolade", "Krak Chocolade", "Chocolade & koek", null, "Ambachtelijke repen en chocolademelk onder een eigen naam, van boon tot reep."),
  ],
};

export const issue13Draft: Draft = {
  title_nl: "Chocolade van makers, op tijd voor Valentijnsdag",
  intro_nl: "Valentijnsdag komt eraan. Deze week vijf Nederlandse chocolademakers die hun chocolade zelf maken.",
  body_md: `## Waarom deze vijf

Ze maken hun chocolade zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Puccini Bomboni, Amsterdam

Bonbons en chocolade uit een eigen chocolademakerij. Een doosje bonbons is het klassieke cadeau.

[Bekijk Puccini Bomboni](/webshop/puccini-bomboni)

## Chocolatemakers, Amsterdam

Elke reep wordt in een eigen fabriek gebrand, gemalen en gegoten. Biologisch. Van boon tot reep in een eigen fabriek.

[Bekijk Chocolatemakers](/webshop/chocolatemakers)

## De Bonte Koe, Schiedam

Handgemaakte repen, bonbons en truffels. Ook in eigen winkels in de regio Rotterdam.

[Bekijk De Bonte Koe](/webshop/de-bonte-koe)

## Chocolate Planet, Hoogkarspel

Bonbons, met de hand gemaakt in een eigen atelier, plus proeverijdozen. Een proeverijdoos laat je zelf kiezen.

[Bekijk Chocolate Planet](/webshop/chocolate-planet)

## Krak Chocolade

Ambachtelijke repen en chocolademelk onder een eigen naam, van boon tot reep. Voor wie houdt van pure repen met een duidelijke smaak.

[Bekijk Krak Chocolade](/webshop/krak-chocolade)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-puccinibomboni", "s-chocolatemakers", "s-debontekoe", "s-chocolateplanet", "s-krakchocolade"],
};
