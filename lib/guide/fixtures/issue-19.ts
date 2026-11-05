// Reference draft for gids issue 19 (2027 week 11, theme "tuinmeubels uit eigen werkplaats"),
// with garden furniture makers from Garden lists 2 and 4 (Tuin & buiten must be published). Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 17.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue19Snapshot: GuideSnapshot = {
  slug: "2027-week-11",
  window: { start: "2027-03-07T23:00:00.000Z", end: "2027-03-14T23:00:00.000Z" },
  shops: [
    shop("s-houtkwadraat", "mooimakerij-houtkwadraat", "Mooimakerij Houtkwadraat", "Tuinmeubels", "Rijen", "Tuinbanken, picknicktafels en stoelen van hout en staal, ontworpen en gemaakt in de eigen werkplaats."),
    shop("s-buitenduurzaam", "buitenduurzaam", "BuitenDuurzaam", "Tuinmeubels", "Hoogeveen", "Tuintafels, loungesets en buitenkeukens uit de eigen werkplaats, zonder tussenhandel."),
    shop("s-vondel", "vondel-tuinmeubelen", "Vondel Tuinmeubelen", "Tuinmeubels", null, "Houten tuinbanken van FSC-hout, gemaakt in Nederland door een familiebedrijf bij Tiel."),
    shop("s-thuins", "thuins", "Thuins", "Tuinmeubels", "Nieuw-Buinen", "Tuintafels, banken, schommelbanken en loungesets op maat uit de eigen werkplaats, van douglas, lariks en steigerhout."),
    shop("s-hout1893", "hout-1893", "HOUT 1893", "Tuinmeubels", "Burgum", "Tuintafels, loungesets, banken en picknicktafels van douglas, met de hand gemaakt in de eigen werkplaats in Friesland."),
  ],
};

export const issue19Draft: Draft = {
  title_nl: "Tuinmeubels uit eigen werkplaats",
  intro_nl: "Wie in de zomer buiten wil zitten, bestelt nu. Deze week vijf makers van tuinmeubels.",
  body_md: `## Waarom deze vijf

Ze ontwerpen en maken hun tafels en banken zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Mooimakerij Houtkwadraat, Rijen

Tuinbanken, picknicktafels en stoelen van hout en staal, ontworpen en gemaakt in de eigen werkplaats. Hout en staal, stevig genoeg voor elk weer.

[Bekijk Mooimakerij Houtkwadraat](/webshop/mooimakerij-houtkwadraat)

## BuitenDuurzaam, Hoogeveen

Tuintafels, loungesets en buitenkeukens uit de eigen werkplaats, zonder tussenhandel. Je koopt direct bij de maker.

[Bekijk BuitenDuurzaam](/webshop/buitenduurzaam)

## Vondel Tuinmeubelen

Houten tuinbanken van FSC-hout, gemaakt in Nederland door een familiebedrijf bij Tiel. Een bank om jaren op te zitten.

[Bekijk Vondel Tuinmeubelen](/webshop/vondel-tuinmeubelen)

## Thuins, Nieuw-Buinen

Tuintafels, banken, schommelbanken en loungesets op maat uit de eigen werkplaats, van douglas, lariks en steigerhout. Op maat, dus passend voor jouw terras.

[Bekijk Thuins](/webshop/thuins)

## HOUT 1893, Burgum

Tuintafels, loungesets, banken en picknicktafels van douglas, met de hand gemaakt in de eigen werkplaats in Friesland. Douglas wordt mooi grijs als je het laat staan.

[Bekijk HOUT 1893](/webshop/hout-1893)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-houtkwadraat", "s-buitenduurzaam", "s-vondel", "s-thuins", "s-hout1893"],
};
