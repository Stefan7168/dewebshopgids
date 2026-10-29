// Reference draft for gids issue 7 (week 51, theme "slapen in de winter: dekbedden, wol en linnen"),
// from the editorial calendar in /mnt/project-files/launch/gids-editorial-calendar.md.
// Same rules as issues 1 to 6. Founding years from the research notes are not inputs, so they stay out.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category: "Slapen", score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue7Snapshot: GuideSnapshot = {
  slug: "2026-week-51",
  window: { start: "2026-12-06T23:00:00.000Z", end: "2026-12-13T23:00:00.000Z" },
  shops: [
    shop("s-mattsleeps", "matt-sleeps", "Matt Sleeps", null, "Matrassen, bedden, kussens en dekbedden, eigen ontwerp en gemaakt in Nederland."),
    shop("s-zelesta", "zelesta", "Zelesta", null, "Wasbare dekbedden en kussens onder een eigen merk."),
    shop("s-khasto", "khasto", "Khasto", "Amsterdam", "Beddengoed van biologisch katoen met eigen blokdrukken."),
    shop("s-passionforlinen", "passion-for-linen", "Passion for Linen", "Venlo", "Beddengoed van linnen en katoen, ontworpen in Nederland."),
    shop("s-wollendekbed", "wollendekbed-nl", "Wollendekbed.nl", null, "Wollen dekbedden, kussens en toppers van kleine ateliers."),
  ],
};

export const issue7Draft: Draft = {
  title_nl: "Slapen in de winter: dekbedden, wol en linnen",
  intro_nl: "De kerstvakantie komt eraan en de nachten zijn lang. Deze week vijf Nederlandse webshops voor een warm en rustig bed.",
  body_md: `## Waarom deze vijf

De meeste verkopen hun eigen ontwerpen of hun eigen merk. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Matt Sleeps

Matrassen, bedden, kussens en dekbedden, eigen ontwerp en gemaakt in Nederland. Voor wie het hele bed in één keer wil vernieuwen.

[Bekijk Matt Sleeps](/webshop/matt-sleeps)

## Zelesta

Wasbare dekbedden en kussens onder een eigen merk. Handig in de winter, als je het dekbed vaker wilt wassen.

[Bekijk Zelesta](/webshop/zelesta)

## Khasto, Amsterdam

Beddengoed van biologisch katoen met eigen blokdrukken. Een rustig patroon voor donkere ochtenden.

[Bekijk Khasto](/webshop/khasto)

## Passion for Linen, Venlo

Beddengoed van linnen en katoen, ontworpen in Nederland. Linnen voelt koel in de zomer en warm in de winter.

[Bekijk Passion for Linen](/webshop/passion-for-linen)

## Wollendekbed.nl

Wollen dekbedden, kussens en toppers van kleine ateliers. Deze shop maakt zelf niet, maar kiest kleine makers uit.

[Bekijk Wollendekbed.nl](/webshop/wollendekbed-nl)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-mattsleeps", "s-zelesta", "s-khasto", "s-passionforlinen", "s-wollendekbed"],
};
