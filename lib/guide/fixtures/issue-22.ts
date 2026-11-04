// Reference draft for gids issue 22 (2027 week 14, theme "een rustige slaapkamer voor het voorjaar"),
// with slapen shops from Home lists 1 to 3. Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 21.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue22Snapshot: GuideSnapshot = {
  slug: "2027-week-14",
  window: { start: "2027-03-28T22:00:00.000Z", end: "2027-04-04T22:00:00.000Z" },
  shops: [
    shop("s-lievelingslinnen", "lievelingslinnen", "Lievelingslinnen", "Slapen", "Barneveld", "Specialist in beddengoed met een eigen winkel: dekbedovertrekken, lakens en plaids van linnen en katoen van gekozen merken."),
    shop("s-robuust", "robuust-amsterdam", "Robuust Amsterdam", "Slapen", "Amsterdam", "Eigen merk van bedframes, matrassen en meubels, met een studio en showroom in Amsterdam."),
    shop("s-silvana", "silvana", "Silvana", "Slapen", null, "Eigen merk van kussens, dekbedden en beddengoed."),
    shop("s-happybed", "happybed", "HappyBed", "Slapen", null, "Eigen merk van wasbare dekbedden zonder hoes, en kussens."),
    shop("s-crispsheets", "crisp-sheets", "Crisp Sheets", "Slapen", null, "Eigen merk van hoeslakens, dekbedovertrekken en kussenslopen in eigen stofsoorten."),
  ],
};

export const issue22Draft: Draft = {
  title_nl: "Een frisse start in de slaapkamer",
  intro_nl: "Het voorjaar is een goed moment voor nieuw beddengoed. Deze week vijf adressen voor bedden, dekbedden en lakens.",
  body_md: `## Waarom deze vijf

Vier ontwerpen hun bedden en beddengoed zelf, een is een specialist met een eigen winkel. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Lievelingslinnen, Barneveld

Specialist in beddengoed met een eigen winkel: dekbedovertrekken, lakens en plaids van linnen en katoen van gekozen merken. Linnen voelt in het voorjaar koel aan.

[Bekijk Lievelingslinnen](/webshop/lievelingslinnen)

## Robuust Amsterdam, Amsterdam

Eigen merk van bedframes, matrassen en meubels, met een studio en showroom in Amsterdam. Je kunt de bedden in de showroom proberen.

[Bekijk Robuust Amsterdam](/webshop/robuust-amsterdam)

## Silvana

Eigen merk van kussens, dekbedden en beddengoed. Een kussen kies je op hoe je slaapt.

[Bekijk Silvana](/webshop/silvana)

## HappyBed

Eigen merk van wasbare dekbedden zonder hoes, en kussens. Geen hoes meer om te verschonen.

[Bekijk HappyBed](/webshop/happybed)

## Crisp Sheets

Eigen merk van hoeslakens, dekbedovertrekken en kussenslopen in eigen stofsoorten. Lakens die je per stof kiest.

[Bekijk Crisp Sheets](/webshop/crisp-sheets)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-lievelingslinnen", "s-robuust", "s-silvana", "s-happybed", "s-crispsheets"],
};
