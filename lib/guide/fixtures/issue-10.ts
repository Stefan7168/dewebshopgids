// Reference draft for gids issue 10 (2027 week 02, theme "koffie en thee uit eigen branderij"),
// with roasters and a tea maker from Eten & drinken list 1. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 9.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue10Snapshot: GuideSnapshot = {
  slug: "2027-week-02",
  window: { start: "2027-01-03T23:00:00.000Z", end: "2027-01-10T23:00:00.000Z" },
  shops: [
    shop("s-brandzaak", "brandzaak", "Brandzaak", "Koffie & thee", "Rotterdam", "Koffie, elke dag vers gebrand in een eigen branderij."),
    shop("s-bootkoffie", "boot-koffie", "BOOT Koffie", "Koffie & thee", "Baarn", "Eerlijk ingekochte koffie, elke dag gebrand in een eigen branderij."),
    shop("s-kosukoffiebranderij", "kosu-koffiebranderij", "KOSU Koffiebranderij", "Koffie & thee", "Groningen", "Koffie, vers gebrand in een eigen branderij, plus zetmateriaal en baristaworkshops."),
    shop("s-hetbrandhuys", "het-brandhuys", "Het Brandhuys", "Koffie & thee", "Geertruidenberg", "Bonen, elke week en op bestelling gebrand in een eigen branderij."),
    shop("s-localtea", "localtea", "LocalTea", "Koffie & thee", null, "Thee die in Nederland groeit en met de hand tot eigen melanges wordt verwerkt."),
  ],
};

export const issue10Draft: Draft = {
  title_nl: "Koffie en thee uit eigen branderij",
  intro_nl: "Een warme kop helpt de koudste weken door. Deze week vijf Nederlandse branders en theemakers die zelf branden of mengen.",
  body_md: `## Waarom deze vijf

Ze branden of maken zelf wat ze verkopen. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Brandzaak, Rotterdam

Koffie, elke dag vers gebrand in een eigen branderij. Wie bonen vers wil, zit hier goed.

[Bekijk Brandzaak](/webshop/brandzaak)

## BOOT Koffie, Baarn

Eerlijk ingekochte koffie, elke dag gebrand in een eigen branderij. Een vaste waarde voor wie elke ochtend dezelfde goede kop wil.

[Bekijk BOOT Koffie](/webshop/boot-koffie)

## KOSU Koffiebranderij, Groningen

Koffie, vers gebrand in een eigen branderij, plus zetmateriaal en baristaworkshops. Handig als je ook thuis beter wilt leren zetten.

[Bekijk KOSU Koffiebranderij](/webshop/kosu-koffiebranderij)

## Het Brandhuys, Geertruidenberg

Bonen, elke week en op bestelling gebrand in een eigen branderij. Kleine batches, dus je krijgt wat net gebrand is.

[Bekijk Het Brandhuys](/webshop/het-brandhuys)

## LocalTea

Thee die in Nederland groeit en met de hand tot eigen melanges wordt verwerkt. Voor wie liever thee drinkt: dichterbij dan dit wordt het niet.

[Bekijk LocalTea](/webshop/localtea)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-brandzaak", "s-bootkoffie", "s-kosukoffiebranderij", "s-hetbrandhuys", "s-localtea"],
};
