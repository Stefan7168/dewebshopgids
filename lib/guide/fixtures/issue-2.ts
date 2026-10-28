// Reference draft for gids issue 2 (week 46, theme "licht en warmte voor de donkere maanden"),
// from the editorial calendar in /mnt/project-files/launch/gids-editorial-calendar.md.
// Same rules as issue 1: the Guide Editor writes the real issue from the frozen inputs of its
// week. Shop ids are placeholders; the shops are in the launch list, none is published yet.
// Left out on purpose: founding years ("sinds 1870", "sinds 1873"), because they are not inputs.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

// Descriptions as the pipeline would write them, from what the launch-list research read on each homepage.
const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null, products: null, city,
  description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue2Snapshot: GuideSnapshot = {
  slug: "2026-week-46",
  window: { start: "2026-11-01T23:00:00.000Z", end: "2026-11-08T23:00:00.000Z" },
  shops: [
    shop("s-bolsius", "bolsius", "Bolsius", "Woonaccessoires", "Schijndel", "Kaarsen en theelichtjes uit eigen productie."),
    shop("s-stoov", "stoov", "Stoov", "Woontextiel", null, "Verwarmde kussens en dekens zonder snoer, eigen ontwerp."),
    shop("s-graypants", "graypants", "Graypants", "Verlichting", "Amsterdam", "Hanglampen en tafellampen uit een eigen ontwerpstudio."),
    shop("s-walra", "walra", "Walra", "Woontextiel", null, "Textiel voor bed, bad en keuken onder een eigen merk."),
    shop("s-mrmaria", "mr-maria", "Mr Maria", "Verlichting", null, "Lampen in de vorm van figuren, eigen ontwerp."),
  ],
};

export const issue2Draft: Draft = {
  title_nl: "Licht en warmte: 5 Nederlandse makers voor de donkere maanden",
  intro_nl:
    "De dagen worden korter. Deze week vijf Nederlandse webshops die zelf maken of ontwerpen waar je huis warmer van wordt: kaarsen, lampen en zachte stoffen.",
  body_md: `## Waarom deze vijf

Alle vijf verkopen vooral hun eigen ontwerpen of producten. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Bolsius, Schijndel

Kaarsen en theelichtjes uit eigen productie. Handig als je wilt weten waar je kaarsen vandaan komen.

[Bekijk Bolsius](/webshop/bolsius)

## Stoov

Verwarmde kussens en dekens zonder snoer, zelf ontworpen. Voor wie het buiten of op de bank wat langer warm wil houden.

[Bekijk Stoov](/webshop/stoov)

## Graypants, Amsterdam

Hanglampen en tafellampen uit een eigen ontwerpstudio. Zacht licht voor lange avonden.

[Bekijk Graypants](/webshop/graypants)

## Walra

Textiel voor bed, bad en keuken onder een eigen merk. Een plek voor zachte handdoeken en dekbedovertrekken als het kouder wordt.

[Bekijk Walra](/webshop/walra)

## Mr Maria

Lampen in de vorm van figuren, zelf ontworpen. Leuk voor de kinderkamer, of voor wie een lamp wil die ook iets vertelt.

[Bekijk Mr Maria](/webshop/mr-maria)

## Vorige week gemist?

In de vorige gids stonden vijf Nederlandse werkplaatsen. Lees hem terug in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-bolsius", "s-stoov", "s-graypants", "s-walra", "s-mrmaria"],
};
