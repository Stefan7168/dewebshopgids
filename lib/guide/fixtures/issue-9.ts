// Reference draft for gids issue 9 (2027 week 1, theme "een frisse start: kinderkamer en opbergen"),
// from the editorial calendar in /mnt/project-files/launch/gids-editorial-calendar.md, with kids
// room shops from Home & Living list 2. Same rules as issues 1 to 8.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue9Snapshot: GuideSnapshot = {
  slug: "2027-week-01",
  window: { start: "2026-12-27T23:00:00.000Z", end: "2027-01-03T23:00:00.000Z" },
  shops: [
    shop("s-uitgezaagd", "uitgezaagd", "Uitgezaagd", "Meubels", "Nederhorst den Berg", "Houten kinderbedden, bureaus en Montessori-meubels, met de hand gemaakt in een eigen atelier."),
    shop("s-petiteamelie", "petite-amelie", "Petite Amélie", "Meubels", "Bussum", "Eigen ontwerpen voor de kinderkamer: bedden, kasten, beddengoed en houten speelgoed."),
    shop("s-muurart", "muur-art", "Muur Art", "Woonaccessoires", "Wormerveer", "Houten wandpanelen en decoratie voor de kinderkamer uit een eigen werkplaats."),
    shop("s-handmadehout", "handmade-hout", "Handmade Hout", "Woonaccessoires", "Sint-Oedenrode", "Houten naambordjes en decoratie voor de kinderkamer uit een eigen werkplaats."),
    shop("s-bink", "bink-bedding", "BINK Bedding", "Woontextiel", null, "Beddengoed voor kinderen, ontworpen en gemaakt in Nederland."),
  ],
};

export const issue9Draft: Draft = {
  title_nl: "Een frisse start voor de kinderkamer",
  intro_nl: "Januari is een goed moment om de kinderkamer op te ruimen en opnieuw in te richten. Deze week vijf Nederlandse makers voor kinderkamers.",
  body_md: `## Waarom deze vijf

Ze maken of ontwerpen zelf wat ze verkopen. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Uitgezaagd, Nederhorst den Berg

Houten kinderbedden, bureaus en Montessori-meubels, met de hand gemaakt in een eigen atelier. Meubels die met het kind meegroeien.

[Bekijk Uitgezaagd](/webshop/uitgezaagd)

## Petite Amélie, Bussum

Eigen ontwerpen voor de kinderkamer: bedden, kasten, beddengoed en houten speelgoed. Handig als je kast en bed bij elkaar wilt laten passen.

[Bekijk Petite Amélie](/webshop/petite-amelie)

## Muur Art, Wormerveer

Houten wandpanelen en decoratie uit een eigen werkplaats. Een lege muur wordt zo snel iets persoonlijks.

[Bekijk Muur Art](/webshop/muur-art)

## Handmade Hout, Sint-Oedenrode

Houten naambordjes en decoratie uit een eigen werkplaats. Een klein stuk dat de kamer van het kind zelf maakt.

[Bekijk Handmade Hout](/webshop/handmade-hout)

## BINK Bedding

Beddengoed voor kinderen, ontworpen en gemaakt in Nederland. Een nieuw dekbedovertrek is de snelste frisse start.

[Bekijk BINK Bedding](/webshop/bink-bedding)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-uitgezaagd", "s-petiteamelie", "s-muurart", "s-handmadehout", "s-bink"],
};
