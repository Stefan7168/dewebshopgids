// Reference draft for gids issue 20 (2027 week 12, theme "een gedekte tafel voor Pasen"),
// with ceramicists, a weaver and a board maker from Home lists 2 and 5. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 17.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue20Snapshot: GuideSnapshot = {
  slug: "2027-week-12",
  window: { start: "2027-03-14T23:00:00.000Z", end: "2027-03-21T23:00:00.000Z" },
  shops: [
    shop("s-dansendekat", "pottenbakkerij-de-dansende-kat", "Pottenbakkerij De Dansende Kat", "Keuken en tafelen", "Arnhem", "Op de draaischijf gemaakte mokken, kommen, borden, vazen en theepotten uit de eigen pottenbakkerij."),
    shop("s-blubberenglas", "blubber-en-glas", "Blubber en Glas", "Keuken en tafelen", "Leiden", "Mokken, borden, kommen en vazen van steengoed, elk met de hand gemaakt in het eigen atelier."),
    shop("s-bryck", "bryck", "BRYCK", "Keuken en tafelen", "Joure", "Mokken, kommen en borden van steengoed, met de hand gemaakt in Nederland."),
    shop("s-klee", "handweverij-klee", "Handweverij KLEE", "Woontextiel", "Zaandam", "Handgeweven theedoeken, servetten, tafellopers, tafelkleden en kussens uit de eigen weverij. Ook stoffen op maat."),
    shop("s-hooghout", "hooghout", "Hooghout", "Keuken en tafelen", "Hoogwoud", "Snijplanken, hakblokken en broodplanken van eiken, esdoorn en noten, gemaakt in de eigen houtwerkplaats."),
  ],
};

export const issue20Draft: Draft = {
  title_nl: "Een gedekte tafel voor Pasen",
  intro_nl: "Pasen komt eraan. Deze week vijf makers van servies, linnen en planken voor op tafel.",
  body_md: `## Waarom deze vijf

Ze draaien, weven en zagen alles zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Pottenbakkerij De Dansende Kat, Arnhem

Op de draaischijf gemaakte mokken, kommen, borden, vazen en theepotten uit de eigen pottenbakkerij. Ook de theepot voor bij het ontbijt.

[Bekijk Pottenbakkerij De Dansende Kat](/webshop/pottenbakkerij-de-dansende-kat)

## Blubber en Glas, Leiden

Mokken, borden, kommen en vazen van steengoed, elk met de hand gemaakt in het eigen atelier. Geen twee borden zijn hetzelfde.

[Bekijk Blubber en Glas](/webshop/blubber-en-glas)

## BRYCK, Joure

Mokken, kommen en borden van steengoed, met de hand gemaakt in Nederland. Stevig servies voor elke dag.

[Bekijk BRYCK](/webshop/bryck)

## Handweverij KLEE, Zaandam

Handgeweven theedoeken, servetten, tafellopers, tafelkleden en kussens uit de eigen weverij. Ook stoffen op maat. Een tafelkleed dat van een weefgetouw komt.

[Bekijk Handweverij KLEE](/webshop/handweverij-klee)

## Hooghout, Hoogwoud

Snijplanken, hakblokken en broodplanken van eiken, esdoorn en noten, gemaakt in de eigen houtwerkplaats. Voor het brood op de paastafel.

[Bekijk Hooghout](/webshop/hooghout)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-dansendekat", "s-blubberenglas", "s-bryck", "s-klee", "s-hooghout"],
};
