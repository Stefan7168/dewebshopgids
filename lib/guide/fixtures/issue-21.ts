// Reference draft for gids issue 21 (2027 week 13, theme "groen en kaarslicht in huis"),
// with candle makers, ceramicists and a planter maker from Home list 2. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 17.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue21Snapshot: GuideSnapshot = {
  slug: "2027-week-13",
  window: { start: "2027-03-21T23:00:00.000Z", end: "2027-03-28T22:00:00.000Z" },
  shops: [
    shop("s-botanicalcandle", "the-botanical-candle", "The Botanical Candle", "Woonaccessoires", "Mijdrecht", "Geurkaarsen en geurstokjes op plantaardige basis, ontwikkeld en met de hand gegoten in de eigen kaarsenmakerij."),
    shop("s-nubiti", "nubiti", "Nubiti", "Woonaccessoires", "Klazienaveen", "Met de hand gegoten kaarsen: stompkaarsen, bolkaarsen, figuurkaarsen en kaarsen met een eigen tekst, uit de eigen werkplaats."),
    shop("s-clayshaper", "the-clay-shaper", "The Clay Shaper", "Woonaccessoires", null, "Met de hand gemaakte vazen, potten, schalen en kandelaars van keramiek, elk stuk uniek en gemaakt in de eigen studio."),
    shop("s-vroen20", "vroen-20", "VROEN 20", "Woonaccessoires", null, "Keramiekstudio die vazen, schalen, servies, kandelaars en kaasplanken met de hand maakt. Ook op bestelling."),
    shop("s-pikaplant", "pikaplant", "Pikaplant", "Woonaccessoires", null, "Eigen ontwerpen van planten in glas en zelfwaterende potten van keramiek, deels met de hand gemaakt in Nederland."),
  ],
};

export const issue21Draft: Draft = {
  title_nl: "Groen en kaarslicht in huis",
  intro_nl: "Het voorjaar begint, ook binnen. Deze week vijf makers van kaarsen, vazen en potten.",
  body_md: `## Waarom deze vijf

Ze gieten, draaien en ontwerpen hun werk zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## The Botanical Candle, Mijdrecht

Geurkaarsen en geurstokjes op plantaardige basis, ontwikkeld en met de hand gegoten in de eigen kaarsenmakerij. Geur zonder paraffine.

[Bekijk The Botanical Candle](/webshop/the-botanical-candle)

## Nubiti, Klazienaveen

Met de hand gegoten kaarsen: stompkaarsen, bolkaarsen, figuurkaarsen en kaarsen met een eigen tekst, uit de eigen werkplaats. Een kaars met een naam erop.

[Bekijk Nubiti](/webshop/nubiti)

## The Clay Shaper

Met de hand gemaakte vazen, potten, schalen en kandelaars van keramiek, elk stuk uniek en gemaakt in de eigen studio. Voor de eerste tulpen.

[Bekijk The Clay Shaper](/webshop/the-clay-shaper)

## VROEN 20

Keramiekstudio die vazen, schalen, servies, kandelaars en kaasplanken met de hand maakt. Ook op bestelling. Een vaas die je zelf kunt laten maken.

[Bekijk VROEN 20](/webshop/vroen-20)

## Pikaplant

Eigen ontwerpen van planten in glas en zelfwaterende potten van keramiek, deels met de hand gemaakt in Nederland. Groen dat weinig water vraagt.

[Bekijk Pikaplant](/webshop/pikaplant)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-botanicalcandle", "s-nubiti", "s-clayshaper", "s-vroen20", "s-pikaplant"],
};
