// Reference draft for gids issue 3 (week 47, theme "cadeaus van makers, ruim voor Sinterklaas"),
// from the editorial calendar in /mnt/project-files/launch/gids-editorial-calendar.md.
// Same rules as issues 1 and 2: shop ids are placeholders for launch-list shops, descriptions
// come from the verified launch research. Founding years are left out (not inputs). Heinen's
// WebwinkelKeur is only claimed on its own site, so the snapshot shows no keurmerk for it.
import type { Draft } from "../check";
import type { GuideShop, GuideSnapshot } from "../inputs";

const shop = (id: string, slug: string, name: string, category: string, city: string | null, description: string, keurmerk = "Geen keurmerk gevonden"): GuideShop => ({
  id, slug, name, category, score: null, score_label: null, keurmerk, online_since: null, products: null, city,
  description, clicks: 0, reason: "nieuw", score_change: null,
});

export const issue3Snapshot: GuideSnapshot = {
  slug: "2026-week-47",
  window: { start: "2026-11-08T23:00:00.000Z", end: "2026-11-15T23:00:00.000Z" },
  shops: [
    shop("s-heinen", "heinen-delfts-blauw", "Heinen Delfts Blauw", "Woonaccessoires", "Putten", "Delfts blauw keramiek, decoratie en cadeaus onder een eigen merk."),
    shop("s-bredemeijer", "bredemeijer", "Bredemeijer", "Keuken en tafelen", "Apeldoorn", "Theepotten en thee-accessoires onder een eigen merk."),
    shop("s-boska", "boska-food-tools", "BOSKA Food Tools", "Keuken en tafelen", null, "Kaasgereedschap, fondue en messen uit eigen productie.", "Thuiswinkel Waarborg (gecontroleerd)"),
    shop("s-dutchdeluxes", "dutchdeluxes", "Dutchdeluxes", "Keuken en tafelen", null, "Schorten, snijplanken en keukenspullen onder een eigen merk."),
    shop("s-pols", "polspotten", "POLSPOTTEN", "Woonaccessoires", "Amsterdam", "Objecten voor huis en horeca, eigen ontwerp."),
  ],
};

export const issue3Draft: Draft = {
  title_nl: "Cadeaus van makers: 5 tips ruim voor Sinterklaas",
  intro_nl:
    "Wie op tijd bestelt, kan kiezen. Deze week vijf Nederlandse webshops met eigen ontwerpen die goed in een schoen of onder de boom passen.",
  body_md: `## Waarom deze vijf

Alle vijf verkopen vooral wat ze zelf ontwerpen of maken. Dat is wat onze echtheidsscore meet. Hoe dat werkt, lees je op [Hoe wij beoordelen](/hoe-wij-beoordelen).

## Heinen Delfts Blauw, Putten

Delfts blauw keramiek en decoratie onder een eigen merk. Een cadeau met een Hollands verhaal, ook voor iemand in het buitenland.

[Bekijk Heinen Delfts Blauw](/webshop/heinen-delfts-blauw)

## Bredemeijer, Apeldoorn

Theepotten en alles eromheen, onder een eigen merk. Voor de theedrinker die alles al lijkt te hebben.

[Bekijk Bredemeijer](/webshop/bredemeijer)

## BOSKA Food Tools

Kaasgereedschap, fondue en messen uit eigen productie. BOSKA heeft het keurmerk Thuiswinkel Waarborg, en dat hebben wij gecontroleerd.

[Bekijk BOSKA Food Tools](/webshop/boska-food-tools)

## Dutchdeluxes

Schorten, snijplanken en keukenspullen onder een eigen merk. Een cadeau dat elke dag gebruikt wordt.

[Bekijk Dutchdeluxes](/webshop/dutchdeluxes)

## POLSPOTTEN, Amsterdam

Objecten voor in huis, zelf ontworpen. Voor wie iets zoekt dat je niet in elke winkel ziet.

[Bekijk POLSPOTTEN](/webshop/polspotten)

## Meer tips

Alle eerdere gidsen staan in het [overzicht van alle gidsen](/gids).

## Ken jij een webshop die hier hoort?

Een kleine maker of specialist die we nog niet kennen? Stuur ons de naam via [Informatie voor webshops](/informatie-voor-webshops).`,
  shop_ids: ["s-heinen", "s-bredemeijer", "s-boska", "s-dutchdeluxes", "s-pols"],
};
