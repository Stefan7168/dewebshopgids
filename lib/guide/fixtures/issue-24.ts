// Reference draft for gids issue 24 (2027 week 16, theme "koken met gerei van eigen merk"),
// with kitchen brands from Home lists 1 to 3. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 21.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue24Snapshot: GuideSnapshot = {
  slug: "2027-week-16",
  window: { start: "2027-04-11T22:00:00.000Z", end: "2027-04-18T22:00:00.000Z" },
  shops: [
    shop("s-combekk", "combekk", "Combekk", "Keuken en tafelen", "Breda", "Eigen merk van pannen en kookgerei."),
    shop("s-cookandpan", "cook-and-pan", "Cook & Pan", "Keuken en tafelen", null, "Eigen merk van pannen en pannensets."),
    shop("s-oooms", "studio-oooms", "Studio OOOMS", "Keuken en tafelen", "Geldrop", "Keukenmessen die met de hand worden gemaakt."),
    shop("s-bk", "bk", "BK", "Keuken en tafelen", null, "Eigen merk van pannen, bestek en keukengerei, al heel lang."),
    shop("s-moccamaster", "moccamaster", "Moccamaster", "Keuken en tafelen", null, "Maakt zelf filterkoffiezetapparaten en koffiemolens."),
  ],
};

export const issue24Draft: Draft = {
  title_nl: "Koken met gerei van eigen merken",
  intro_nl: "Deze week vijf eigen merken voor in de keuken: pannen, messen en koffie.",
  body_md: `## Waarom deze vijf

Ze ontwerpen of maken hun keukengerei zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Combekk, Breda

Eigen merk van pannen en kookgerei. Pannen van een merk uit Breda.

[Bekijk Combekk](/webshop/combekk)

## Cook & Pan

Eigen merk van pannen en pannensets. Een set als je opnieuw begint.

[Bekijk Cook & Pan](/webshop/cook-and-pan)

## Studio OOOMS, Geldrop

Keukenmessen die met de hand worden gemaakt. Elk mes is met de hand gemaakt.

[Bekijk Studio OOOMS](/webshop/studio-oooms)

## BK

Eigen merk van pannen, bestek en keukengerei, al heel lang. Pannen en bestek onder een eigen merk.

[Bekijk BK](/webshop/bk)

## Moccamaster

Maakt zelf filterkoffiezetapparaten en koffiemolens. Voor wie filterkoffie drinkt.

[Bekijk Moccamaster](/webshop/moccamaster)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-combekk", "s-cookandpan", "s-oooms", "s-bk", "s-moccamaster"],
};
