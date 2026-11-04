// Reference draft for gids issue 29 (2027 week 21, theme "planten van eigen kwekerij voor de border"),
// with growers from Garden lists 1 to 4 (Tuin & buiten must be published). Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 25.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue29Snapshot: GuideSnapshot = {
  slug: "2027-week-21",
  window: { start: "2027-05-16T22:00:00.000Z", end: "2027-05-23T22:00:00.000Z" },
  shops: [
    shop("s-bastin", "kwekerij-bastin", "Kwekerij Bastin", "Tuin & buiten", null, "Vaste planten, kruiden, lavendel en prairieplanten van de eigen kwekerij in Zuid-Limburg."),
    shop("s-dearend", "kwekerij-de-arend", "Kwekerij De Arend", "Tuin & buiten", "Almere", "Vaste planten, rozen, inheemse planten en kruiden van de eigen kwekerij. Ze versturen planten."),
    shop("s-ferdinandushof", "ferdinandushof", "Ferdinandushof", "Tuin & buiten", "Overslag", "Tuinplanten van de eigen kwekerij, te bestellen in een aparte webshop."),
    shop("s-kruidenkweker", "kruidenkweker", "Kruidenkweker", "Tuin & buiten", null, "Kruiden in veel soorten, waaronder munt, gekweekt in het Groene Hart."),
    shop("s-vijverplantenland", "vijverplantenland", "Vijverplantenland", "Tuin & buiten", null, "Inheemse vijver- en waterplanten, gekweekt in de eigen buitenvijvers."),
  ],
};

export const issue29Draft: Draft = {
  title_nl: "Planten van eigen kwekerij voor tuin en vijver",
  intro_nl: "Na de IJsheiligen kan alles de grond in. Deze week vijf kwekerijen die hun planten zelf kweken.",
  body_md: `## Waarom deze vijf

Ze kweken hun planten zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Kwekerij Bastin

Vaste planten, kruiden, lavendel en prairieplanten van de eigen kwekerij in Zuid-Limburg.

[Bekijk Kwekerij Bastin](/webshop/kwekerij-bastin)

## Kwekerij De Arend, Almere

Vaste planten, rozen, inheemse planten en kruiden van de eigen kwekerij. Ze versturen planten.

[Bekijk Kwekerij De Arend](/webshop/kwekerij-de-arend)

## Ferdinandushof, Overslag

Tuinplanten van de eigen kwekerij, te bestellen in een aparte webshop.

[Bekijk Ferdinandushof](/webshop/ferdinandushof)

## Kruidenkweker

Kruiden in veel soorten, waaronder munt, gekweekt in het Groene Hart. Een kruidentuin bij de keuken.

[Bekijk Kruidenkweker](/webshop/kruidenkweker)

## Vijverplantenland

Inheemse vijver- en waterplanten, gekweekt in de eigen buitenvijvers. Voor in en rond de vijver.

[Bekijk Vijverplantenland](/webshop/vijverplantenland)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-bastin", "s-dearend", "s-ferdinandushof", "s-kruidenkweker", "s-vijverplantenland"],
};
