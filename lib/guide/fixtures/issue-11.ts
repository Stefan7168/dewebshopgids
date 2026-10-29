// Reference draft for gids issue 11 (2027 week 03, theme "hout uit eigen werkplaats: tafels en kasten op maat"),
// with furniture makers from the launch list and Home & Living list 2. Same rules as issues 1 to 9.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue11Snapshot: GuideSnapshot = {
  slug: "2027-week-03",
  window: { start: "2027-01-10T23:00:00.000Z", end: "2027-01-17T23:00:00.000Z" },
  shops: [
    shop("s-woodindustries", "woodindustries", "Woodindustries", "Meubels", "Woerdense Verlaat", "Tafels op maat, gemaakt door eigen meubelmakers in een eigen werkplaats."),
    shop("s-meubelfabriekwestra", "meubelfabriek-westra", "Meubelfabriek Westra", "Meubels", "Burgum", "Houten tafels, kasten en banken, op maat gemaakt in een eigen fabriek."),
    shop("s-droomhout", "droomhout", "Droomhout", "Meubels", "Utrecht", "Massief houten eettafels, bureaus en wandplanken uit een eigen werkplaats."),
    shop("s-rolanmeubels", "rolan-meubels", "Rolan Meubels", "Meubels", "Veenendaal", "Eiken tafels, bedden en kasten, met de hand gemaakt in een eigen meubelmakerij."),
    shop("s-toverenmethout", "toveren-met-hout", "Toveren met Hout", "Meubels", "Scherpenzeel", "Wandplanken en meubels van massief eiken en noten, op maat gemaakt in een eigen werkplaats."),
  ],
};

export const issue11Draft: Draft = {
  title_nl: "Hout uit eigen werkplaats: tafels en kasten op maat",
  intro_nl: "Januari is een rustige maand om een meubel te laten maken. Deze week vijf makers die tafels en kasten in hun eigen werkplaats bouwen.",
  body_md: `## Waarom deze vijf

Ze maken hun meubels zelf, vaak op maat. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Woodindustries, Woerdense Verlaat

Tafels op maat, gemaakt door eigen meubelmakers in een eigen werkplaats. Je kiest de maat, zij maken de tafel.

[Bekijk Woodindustries](/webshop/woodindustries)

## Meubelfabriek Westra, Burgum

Houten tafels, kasten en banken, op maat gemaakt in een eigen fabriek. Prijzen staan gewoon op de site.

[Bekijk Meubelfabriek Westra](/webshop/meubelfabriek-westra)

## Droomhout, Utrecht

Massief houten eettafels, bureaus en wandplanken uit een eigen werkplaats. Van een plank tot een complete eettafel.

[Bekijk Droomhout](/webshop/droomhout)

## Rolan Meubels, Veenendaal

Eiken tafels, bedden en kasten, met de hand gemaakt in een eigen meubelmakerij. Ook op maat, als de standaardmaat niet past.

[Bekijk Rolan Meubels](/webshop/rolan-meubels)

## Toveren met Hout, Scherpenzeel

Wandplanken en meubels van massief eiken en noten, op maat gemaakt in een eigen werkplaats. Het hout wordt vaak zelf gezaagd en gedroogd.

[Bekijk Toveren met Hout](/webshop/toveren-met-hout)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-woodindustries", "s-meubelfabriekwestra", "s-droomhout", "s-rolanmeubels", "s-toverenmethout"],
};
