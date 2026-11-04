// Reference draft for gids issue 28 (2027 week 20, theme "tafels op maat uit eigen werkplaats"),
// with furniture makers from Home lists 1 to 4. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 25.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue28Snapshot: GuideSnapshot = {
  slug: "2027-week-20",
  window: { start: "2027-05-09T22:00:00.000Z", end: "2027-05-16T22:00:00.000Z" },
  shops: [
    shop("s-trendtable", "trendtable", "Trendtable", "Meubels", "Giessenburg", "Tafels van eiken en noten, met de hand gemaakt in de eigen meubelmakerij. Ook enkele stoelen van andere merken."),
    shop("s-woodandwork", "wood-en-work", "Wood & Work", "Meubels", "Heeswijk-Dinther", "Ontwerpt en maakt wandplanken, kapstokken, tafels en kasten van eiken in de eigen werkplaats."),
    shop("s-houtenmeubelshop", "houtenmeubelshop", "Houtenmeubelshop", "Meubels", "Etten-Leur", "Tv-meubels, inbouwkasten, tafels en stoelen, allemaal gemaakt in de eigen werkplaats. Maatwerk kan."),
    shop("s-steigerhoutenmeubelshop", "steigerhoutenmeubelshop", "Steigerhoutenmeubelshop", "Meubels", "Groot Ammers", "Elk meubel van steigerhout wordt in de eigen werkplaats gemaakt: tafels, kasten en bedden."),
    shop("s-tafelfabriek", "de-tafelfabriek", "De Tafelfabriek", "Meubels", "Noordwolde", "Eettafels, stoelen en tuintafels van een eigen ontwerper, op maat gemaakt in Nederland."),
  ],
};

export const issue28Draft: Draft = {
  title_nl: "Een tafel op maat uit eigen werkplaats",
  intro_nl: "Een eettafel koop je voor jaren. Deze week vijf werkplaatsen die tafels zelf maken, vaak op maat.",
  body_md: `## Waarom deze vijf

Ze maken hun tafels zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Trendtable, Giessenburg

Tafels van eiken en noten, met de hand gemaakt in de eigen meubelmakerij. Ook enkele stoelen van andere merken. Kies je eigen hout.

[Bekijk Trendtable](/webshop/trendtable)

## Wood & Work, Heeswijk-Dinther

Ontwerpt en maakt wandplanken, kapstokken, tafels en kasten van eiken in de eigen werkplaats. Van wandplank tot tafel.

[Bekijk Wood & Work](/webshop/wood-en-work)

## Houtenmeubelshop, Etten-Leur

Tv-meubels, inbouwkasten, tafels en stoelen, allemaal gemaakt in de eigen werkplaats. Maatwerk kan. Een kast die precies past.

[Bekijk Houtenmeubelshop](/webshop/houtenmeubelshop)

## Steigerhoutenmeubelshop, Groot Ammers

Elk meubel van steigerhout wordt in de eigen werkplaats gemaakt: tafels, kasten en bedden. Stoer hout met gebruikssporen.

[Bekijk Steigerhoutenmeubelshop](/webshop/steigerhoutenmeubelshop)

## De Tafelfabriek, Noordwolde

Eettafels, stoelen en tuintafels van een eigen ontwerper, op maat gemaakt in Nederland. Ook een tafel voor buiten.

[Bekijk De Tafelfabriek](/webshop/de-tafelfabriek)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-trendtable", "s-woodandwork", "s-houtenmeubelshop", "s-steigerhoutenmeubelshop", "s-tafelfabriek"],
};
