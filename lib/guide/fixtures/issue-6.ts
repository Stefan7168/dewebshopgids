// Reference draft for gids issue 6 (week 50, theme "laatste kerstcadeaus die nog op tijd komen"),
// from the editorial calendar in /mnt/project-files/launch/gids-editorial-calendar.md.
// Same rules as issues 1 to 5. Delivery times are not inputs, so the copy promises no delivery
// date and tells readers to check the shop's own delivery time.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, description: string): GuideShop => ({
  id, slug, name, category: "Woonaccessoires", score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city: null, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue6Snapshot: GuideSnapshot = {
  slug: "2026-week-50",
  window: { start: "2026-11-29T23:00:00.000Z", end: "2026-12-06T23:00:00.000Z" },
  shops: [
    shop("s-ixxi", "ixxi", "IXXI", "Wandkunst van losse kaarten die je zelf samenstelt, onder een eigen merk."),
    shop("s-klevering", "en-k-amsterdam-klevering", "&k amsterdam", "Woonaccessoires en objecten van een eigen merk."),
    shop("s-ditte", "studio-ditte", "Studio Ditte", "Eigen ontwerpen: behang, beddengoed en posters."),
    shop("s-unc", "urban-nature-culture", "Urban Nature Culture", "Een eigen merk voor woondecoratie, tafelen en textiel."),
    shop("s-zusss", "zusss", "ZUSSS", "Een eigen label met cadeaus en woonaccessoires."),
  ],
};

export const issue6Draft: Draft = {
  title_nl: "Kerstcadeaus van Nederlandse merken: bestel nu",
  intro_nl:
    "Kerst komt dichterbij. Deze week vijf Nederlandse webshops met een eigen merk, voor een cadeau dat niet iedereen al heeft.",
  body_md: `## Bestel op tijd

Rond de feestdagen duurt bezorgen vaak langer. Kijk bij elke shop naar de levertijd voordat je bestelt.

## Waarom deze vijf

Ze verkopen vooral hun eigen ontwerpen. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## IXXI

Wandkunst van losse kaarten die je zelf samenstelt. Een cadeau dat je op maat maakt voor de muur van een ander.

[Bekijk IXXI](/webshop/ixxi)

## &k amsterdam

Woonaccessoires en objecten van een eigen merk. Voor een klein cadeau onder de boom.

[Bekijk &k amsterdam](/webshop/en-k-amsterdam-klevering)

## Studio Ditte

Eigen ontwerpen in behang, beddengoed en posters. Een poster is een makkelijk cadeau dat toch persoonlijk voelt.

[Bekijk Studio Ditte](/webshop/studio-ditte)

## Urban Nature Culture

Een eigen merk voor woondecoratie, tafelen en textiel. Goed voor wie iets zoekt voor op de kersttafel.

[Bekijk Urban Nature Culture](/webshop/urban-nature-culture)

## ZUSSS

Een eigen label met cadeaus en woonaccessoires. Handig als je nog een paar kleine cadeaus nodig hebt.

[Bekijk ZUSSS](/webshop/zusss)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-ixxi", "s-klevering", "s-ditte", "s-unc", "s-zusss"],
};
