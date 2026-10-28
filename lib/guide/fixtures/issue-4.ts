// Reference draft for gids issue 4 (week 48, theme "gedekte tafel: servies en glas uit eigen atelier"),
// from the editorial calendar in /mnt/project-files/launch/gids-editorial-calendar.md.
// Same rules as issues 1 to 3. Royal Goedewaagen is left out because issue 1 already had it.
// Founding years (1572, 1653) are left out: they are not inputs.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category: "Keuken en tafelen", score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue4Snapshot: GuideSnapshot = {
  slug: "2026-week-48",
  window: { start: "2026-11-15T23:00:00.000Z", end: "2026-11-22T23:00:00.000Z" },
  shops: [
    shop("s-royaldelft", "royal-delft", "Royal Delft", "Delft", "Handbeschilderd Delfts blauw servies en vazen uit eigen fabriek."),
    shop("s-tichelaar", "koninklijke-tichelaar-makkum", "Koninklijke Tichelaar Makkum", "Makkum", "Keramiek uit eigen werkplaats."),
    shop("s-leerdam", "royal-leerdam", "Royal Leerdam", null, "Glazen en karaffen uit eigen productie."),
    shop("s-blond", "blond-amsterdam", "Blond Amsterdam", null, "Vrolijk servies en cadeaus onder een eigen merk."),
    shop("s-sola", "sola", "Sola", "Zeist", "Bestek en pannen onder een eigen merk."),
  ],
};

export const issue4Draft: Draft = {
  title_nl: "De gedekte tafel: servies, glas en bestek van Nederlandse makers",
  intro_nl:
    "December is de maand van lange etentjes. Deze week vijf Nederlandse webshops die zelf maken of ontwerpen wat er op tafel staat.",
  body_md: `## Waarom deze vijf

Ze verkopen vooral hun eigen servies, glas of bestek. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Royal Delft, Delft

Handbeschilderd Delfts blauw servies en vazen uit eigen fabriek. Voor een tafel met een klassiek accent.

[Bekijk Royal Delft](/webshop/royal-delft)

## Koninklijke Tichelaar Makkum, Makkum

Keramiek uit een eigen werkplaats. Voor wie borden en schalen zoekt die niet uit een massafabriek komen.

[Bekijk Koninklijke Tichelaar Makkum](/webshop/koninklijke-tichelaar-makkum)

## Royal Leerdam

Glazen en karaffen uit eigen productie. Een goede plek als je de glazen bij het servies zoekt.

[Bekijk Royal Leerdam](/webshop/royal-leerdam)

## Blond Amsterdam

Vrolijk servies onder een eigen merk. Mooi om te combineren met wit servies dat je al hebt.

[Bekijk Blond Amsterdam](/webshop/blond-amsterdam)

## Sola, Zeist

Bestek en pannen onder een eigen merk. Voor wie bij nieuw servies ook het bestek wil vernieuwen.

[Bekijk Sola](/webshop/sola)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-royaldelft", "s-tichelaar", "s-leerdam", "s-blond", "s-sola"],
};
