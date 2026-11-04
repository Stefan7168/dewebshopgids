// Reference draft for gids issue 17 (2027 week 09, theme "licht en vuur voor de eerste avonden buiten"),
// with shops from Garden lists 2 to 4 (Tuin & buiten must be published). Needs those shops published; otherwise the Editor uses the week's best new shops. Same rules as issues 1 to 13.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk: "Geen keurmerk gevonden", online_since: null,
  products: null, city, description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue17Snapshot: GuideSnapshot = {
  slug: "2027-week-09",
  window: { start: "2027-02-21T23:00:00.000Z", end: "2027-02-28T23:00:00.000Z" },
  shops: [
    shop("s-artisans", "artisans", "Artisans", "Buitenverlichting", "Naarden", "Klassieke buitenlantaarns voor muur, plafond en paal, met de hand gemaakt. Je kiest maat, kleur en glas. Ook reparatie van lantaarns."),
    shop("s-boomstamwinkel", "boomstamwinkel", "Boomstamwinkel", "Buitenverlichting", "Brakel", "Buitenlampen, tuinverlichting en meubels, met de hand gemaakt van hergebruikt hout uit meerpalen."),
    shop("s-vuurtafelpro", "vuurtafel-pro", "Vuurtafel Pro", "Vuur & bbq", "Roden", "Vuurtafels en inbouwbranders van eigen ontwerp, ook op maat. Met showroom."),
    shop("s-prinsbbq", "prins-barbecue-pits", "Prins Barbecue Pits", "Vuur & bbq", null, "Smokers, vuurschalen, rookkasten en grills, stuk voor stuk met de hand gemaakt in Nederland, ook op maat."),
    shop("s-staalatelier", "het-staalatelier", "Het Staalatelier", "Tuinaccessoires", "Overasselt", "Waterornamenten, watervallen, brievenbussen en tuinelementen van cortenstaal, op bestelling gemaakt."),
  ],
};

export const issue17Draft: Draft = {
  title_nl: "Licht en vuur voor de eerste avonden buiten",
  intro_nl: "De avonden worden langer. Deze week vijf makers van buitenlampen, vuurtafels en barbecues.",
  body_md: `## Waarom deze vijf

Ze maken hun lampen en vuur zelf. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Artisans, Naarden

Klassieke buitenlantaarns voor muur, plafond en paal, met de hand gemaakt. Je kiest maat, kleur en glas. Ook een adres om een oude lantaarn te laten maken.

[Bekijk Artisans](/webshop/artisans)

## Boomstamwinkel, Brakel

Buitenlampen, tuinverlichting en meubels, met de hand gemaakt van hergebruikt hout uit meerpalen. Elk stuk hout heeft al een leven gehad.

[Bekijk Boomstamwinkel](/webshop/boomstamwinkel)

## Vuurtafel Pro, Roden

Vuurtafels en inbouwbranders van eigen ontwerp, ook op maat. Met showroom. Vuur aan tafel, zonder rook in je ogen.

[Bekijk Vuurtafel Pro](/webshop/vuurtafel-pro)

## Prins Barbecue Pits

Smokers, vuurschalen, rookkasten en grills, stuk voor stuk met de hand gemaakt in Nederland, ook op maat. Voor wie langzaam wil garen.

[Bekijk Prins Barbecue Pits](/webshop/prins-barbecue-pits)

## Het Staalatelier, Overasselt

Waterornamenten, watervallen, brievenbussen en tuinelementen van cortenstaal, op bestelling gemaakt. Het geluid van water in de tuin.

[Bekijk Het Staalatelier](/webshop/het-staalatelier)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-artisans", "s-boomstamwinkel", "s-vuurtafelpro", "s-prinsbbq", "s-staalatelier"],
};
