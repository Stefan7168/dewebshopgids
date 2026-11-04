// Reference draft for gids issue 18 (2027 week 10, theme "honing en kaas van eigen bedrijf"),
// with honey and cheese makers from Eten & drinken lists 1 and 2 (Eten & drinken must be published). Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 17.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue18Snapshot: GuideSnapshot = {
  slug: "2027-week-10",
  window: { start: "2027-02-28T23:00:00.000Z", end: "2027-03-07T23:00:00.000Z" },
  shops: [
    shop("s-groningsehoning", "groningse-honing", "Groningse Honing", "Honing", null, "Rauwe honing van eigen bijenvolken bij Groningen, ook kaarsen van bijenwas en lekkers met honing."),
    shop("s-honingatelier", "het-honingatelier", "Het Honingatelier", "Honing", null, "Imker in de Achterhoek met honing van eigen volken, in veel soorten. Ook kaarsen van bijenwas."),
    shop("s-wezenspyk", "kaasboerderij-wezenspyk", "Kaasboerderij Wezenspyk", "Kaas & delicatessen", "Den Burg", "Schapen-, koe- en geitenkaas uit de eigen kaasmakerij op een boerderij op Texel."),
    shop("s-weenink", "kaasboerderij-weenink", "Kaasboerderij Weenink", "Kaas & delicatessen", "Lievelde", "Boerenkaas en kruidenkaas van de melk van de eigen koeien, gemaakt in de eigen kaasmakerij in de Achterhoek."),
    shop("s-zeekraal", "schapenboerderij-de-zeekraal", "Schapenboerderij De Zeekraal", "Kaas & delicatessen", "Terschelling", "Biologische schapenboerderij die de eigen schapen melkt en er in de eigen kaasmakerij schapenkaas van maakt."),
  ],
};

export const issue18Draft: Draft = {
  title_nl: "Honing en kaas van eigen bedrijf",
  intro_nl: "Het voorjaar komt eraan. Deze week vijf imkers en kaasmakers die alles zelf maken.",
  body_md: `## Waarom deze vijf

Ze houden zelf de bijen of de dieren, en maken zelf de honing of de kaas. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Groningse Honing

Rauwe honing van eigen bijenvolken bij Groningen, ook kaarsen van bijenwas en lekkers met honing. Honing zoals de bijen hem maken.

[Bekijk Groningse Honing](/webshop/groningse-honing)

## Het Honingatelier

Imker in de Achterhoek met honing van eigen volken, in veel soorten. Ook kaarsen van bijenwas. Elke soort smaakt naar andere bloemen.

[Bekijk Het Honingatelier](/webshop/het-honingatelier)

## Kaasboerderij Wezenspyk, Den Burg

Schapen-, koe- en geitenkaas uit de eigen kaasmakerij op een boerderij op Texel. Kaas van het eiland.

[Bekijk Kaasboerderij Wezenspyk](/webshop/kaasboerderij-wezenspyk)

## Kaasboerderij Weenink, Lievelde

Boerenkaas en kruidenkaas van de melk van de eigen koeien, gemaakt in de eigen kaasmakerij in de Achterhoek. Van de koe naar de kaas op één erf.

[Bekijk Kaasboerderij Weenink](/webshop/kaasboerderij-weenink)

## Schapenboerderij De Zeekraal, Terschelling

Biologische schapenboerderij die de eigen schapen melkt en er in de eigen kaasmakerij schapenkaas van maakt. Kaas met de smaak van de wadden.

[Bekijk Schapenboerderij De Zeekraal](/webshop/schapenboerderij-de-zeekraal)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-groningsehoning", "s-honingatelier", "s-wezenspyk", "s-weenink", "s-zeekraal"],
};
