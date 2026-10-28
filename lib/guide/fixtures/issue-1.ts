// Reference draft for gids issue 1, adapted from /mnt/project-files/launch/gids-issue-1-outline.md
// so it passes checkDraft(). The Guide Editor writes the real issue from the frozen inputs of
// its week; this fixture shows the shape and the limits. Shop ids, scores and the window are
// placeholders: none of these shops is published yet.
// Changes from the outline: slugs as lib/slug makes them (royal-goedewaagen, brand-van-egmond,
// studio-snowpuppe); "1610", "29 collecties" and "sinds 2012" dropped, because founding years
// and collection counts are not inputs (online_since is the domain age, not the founding year).
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, products: string | null, keurmerk = "Geen keurmerk gevonden"): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk, online_since: null, products, city,
  description: null, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue1Snapshot: GuideSnapshot = {
  slug: "2026-week-45",
  window: { start: "2026-10-25T23:00:00.000Z", end: "2026-11-01T23:00:00.000Z" },
  shops: [
    shop("s-goedewaagen", "royal-goedewaagen", "Royal Goedewaagen", "Keuken en tafelen", "Nieuw-Buinen", null),
    shop("s-kooij", "kooij", "Kooij", "Meubels", "Zaandam", "Ongeveer 35 producten"),
    shop("s-bve", "brand-van-egmond", "Brand van Egmond", "Verlichting", "Naarden", null),
    shop("s-yumeko", "yumeko", "Yumeko", "Woontextiel", null, null, "Thuiswinkel Waarborg (gecontroleerd)"),
    shop("s-snowpuppe", "studio-snowpuppe", "Studio Snowpuppe", "Verlichting", "Brielle", "Ongeveer 19 producten"),
  ],
};

export const issue1Draft: Draft = {
  title_nl: "Gemaakt in Nederland: 5 werkplaatsen om te ontdekken",
  intro_nl:
    "Deze week vijf Nederlandse webshops die zelf ontwerpen of maken, van keramiek uit Drenthe tot lampen van papier. Bij elke shop zie je wat wij hebben nagekeken.",
  body_md: `## Waarom deze vijf

Ze hebben één ding gemeen: ze verkopen vooral wat ze zelf ontwerpen of maken. Dat is precies wat onze echtheidsscore meet. Hoe we dat doen, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Royal Goedewaagen, Nieuw-Buinen

Keramiek, servies en woondecoratie uit eigen fabriek in Drenthe. Een goede plek als je servies zoekt dat niet uit een massafabriek komt.

[Bekijk Royal Goedewaagen](/webshop/royal-goedewaagen)

## Kooij, Zaandam

Stoelen, tafels, lampen en objecten uit een eigen ontwerpstudio. Een kleine collectie: ongeveer 35 producten.

[Bekijk Kooij](/webshop/kooij)

## Brand van Egmond, Naarden

Kroonluchters en hanglampen uit een eigen atelier. Je kunt veel ontwerpen naar eigen wens laten aanpassen.

[Bekijk Brand van Egmond](/webshop/brand-van-egmond)

## Yumeko

Beddengoed, dekbedden en kussens van biologisch katoen. Yumeko heeft het keurmerk Thuiswinkel Waarborg, en dat hebben wij gecontroleerd.

[Bekijk Yumeko](/webshop/yumeko)

## Studio Snowpuppe, Brielle

Lampen en klokken van papier en hout, gevouwen als origami. Een overzichtelijke collectie van ongeveer 19 producten.

[Bekijk Studio Snowpuppe](/webshop/studio-snowpuppe)

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-goedewaagen", "s-kooij", "s-bve", "s-yumeko", "s-snowpuppe"],
};
