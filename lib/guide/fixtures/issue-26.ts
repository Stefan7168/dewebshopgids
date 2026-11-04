// Reference draft for gids issue 26 (2027 week 18, theme "cadeaus van makers voor Moederdag"),
// with home accessory labels from Home lists 1 to 3. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 25.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue26Snapshot: GuideSnapshot = {
  slug: "2027-week-18",
  window: { start: "2027-04-25T22:00:00.000Z", end: "2027-05-02T22:00:00.000Z" },
  shops: [
    shop("s-alltheluck", "all-the-luck-in-the-world", "All the Luck in the World", "Woonaccessoires", "Amsterdam", "Eigen label van servies, vazen, kaarsen en woonaccessoires, plus opgeknapte vondsten van Franse vlooienmarkten."),
    shop("s-brut", "brut-homeware", "Brût Homeware", "Woonaccessoires", "Amsterdam", "Eigen merk van houten haken, glaswerk en woonartikelen."),
    shop("s-riverdale", "riverdale", "Riverdale", "Woonaccessoires", null, "Eigen collecties, ontworpen in Nederland: geurstokjes, kaarsen en roomspray."),
    shop("s-doinggoods", "doing-goods", "Doing Goods", "Woonaccessoires", null, "Eigen label van handgemaakte woonaccessoires: kleden, poefs, messing haken, textiel en lampen."),
    shop("s-corunum", "cor-unum", "Cor Unum", "Woonaccessoires", "Den Bosch", "Keramiek van Nederlandse en buitenlandse ontwerpers, gemaakt in het eigen atelier."),
  ],
};

export const issue26Draft: Draft = {
  title_nl: "Cadeaus voor Moederdag van eigen merken",
  intro_nl: "Moederdag komt eraan. Deze week vijf eigen merken met cadeaus voor in huis.",
  body_md: `## Waarom deze vijf

Ze ontwerpen of maken hun collectie zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## All the Luck in the World, Amsterdam

Eigen label van servies, vazen, kaarsen en woonaccessoires, plus opgeknapte vondsten van Franse vlooienmarkten. Een vaas met een verhaal.

[Bekijk All the Luck in the World](/webshop/all-the-luck-in-the-world)

## Brût Homeware, Amsterdam

Eigen merk van houten haken, glaswerk en woonartikelen. Klein, maar elke dag in gebruik.

[Bekijk Brût Homeware](/webshop/brut-homeware)

## Riverdale

Eigen collecties, ontworpen in Nederland: geurstokjes, kaarsen en roomspray. Geur voor in huis.

[Bekijk Riverdale](/webshop/riverdale)

## Doing Goods

Eigen label van handgemaakte woonaccessoires: kleden, poefs, messing haken, textiel en lampen. Kleur en vrolijkheid in een kamer.

[Bekijk Doing Goods](/webshop/doing-goods)

## Cor Unum, Den Bosch

Keramiek van Nederlandse en buitenlandse ontwerpers, gemaakt in het eigen atelier. Ontwerp en atelier onder een dak.

[Bekijk Cor Unum](/webshop/cor-unum)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-alltheluck", "s-brut", "s-riverdale", "s-doinggoods", "s-corunum"],
};
