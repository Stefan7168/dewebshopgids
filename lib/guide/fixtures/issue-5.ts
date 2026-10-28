// Reference draft for gids issue 5 (week 49, theme "tweede leven: vintage en tweedehands design"),
// from the editorial calendar in /mnt/project-files/launch/gids-editorial-calendar.md.
// Same rules as issues 1 to 4. Vintage dealers are curated (no score points for curation, see
// DECISIONS.md), so the copy says what they do and makes no claim about the score.
// Years and showroom sizes from the research notes are left out: they are not inputs.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue5Snapshot: GuideSnapshot = {
  slug: "2026-week-49",
  window: { start: "2026-11-22T23:00:00.000Z", end: "2026-11-29T23:00:00.000Z" },
  shops: [
    shop("s-machinekamer", "de-machinekamer", "De Machinekamer", "Meubels", "Zaandam", "Vintage en tweedehands designmeubels, met showrooms in Zaandam, Utrecht en Rotterdam."),
    shop("s-decennia", "decennia-design", "Decennia Design", "Meubels", "Tilburg", "Tweedehands designmeubels uit een grote showroom."),
    shop("s-vintagevenue", "vintage-venue", "Vintage Venue", "Meubels", "Oosterhout", "Koopt vintage designmeubels, lampen en kunst in en knapt ze zelf op."),
    shop("s-lamplord", "lamplord", "Lamplord", "Verlichting", "Soest", "Originele vintage lampen, zelf nagekeken en gerepareerd, plus losse lamponderdelen en kappen."),
    shop("s-replate", "replate", "Replate", "Keuken en tafelen", "Den Haag", "Vintage en tweedehands servies, per stuk of als set."),
  ],
};

export const issue5Draft: Draft = {
  title_nl: "Tweede leven: vintage en tweedehands design",
  intro_nl:
    "Na de drukte van Black Friday kiezen we deze week voor stukken die er al waren. Vijf Nederlandse webshops die vintage en tweedehands design een tweede leven geven.",
  body_md: `## Waarom deze vijf

Elk stuk is uniek en komt niet uit een massafabriek. Deze shops maken hun aanbod niet zelf: ze kiezen het uit, knappen het op en verkopen het door. Hoe onze score daarmee omgaat, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## De Machinekamer, Zaandam

Vintage en tweedehands designmeubels, met showrooms in Zaandam, Utrecht en Rotterdam. Fijn als je een stoel of kast eerst in het echt wilt zien.

[Bekijk De Machinekamer](/webshop/de-machinekamer)

## Decennia Design, Tilburg

Tweedehands designmeubels uit een grote showroom. Voor wie een bekend ontwerp zoekt zonder de nieuwprijs.

[Bekijk Decennia Design](/webshop/decennia-design)

## Vintage Venue, Oosterhout

Koopt vintage designmeubels, lampen en kunst in en knapt ze zelf op. Goed om te bekijken als je één bijzonder stuk zoekt.

[Bekijk Vintage Venue](/webshop/vintage-venue)

## Lamplord, Soest

Originele vintage lampen, zelf nagekeken en gerepareerd. Je vindt er ook losse onderdelen en kappen, handig als je een oude lamp wilt opknappen.

[Bekijk Lamplord](/webshop/lamplord)

## Replate, Den Haag

Vintage en tweedehands servies, per stuk of als set. Zo vul je een oud servies aan in plaats van een nieuw te kopen.

[Bekijk Replate](/webshop/replate)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-machinekamer", "s-decennia", "s-vintagevenue", "s-lamplord", "s-replate"],
};
