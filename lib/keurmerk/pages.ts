// "/keurmerk/[slug]" pages (plan v3 section 15, phase 3 list): published shops whose keurmerk we checked
// at the keurmerk organisation itself, ranked by authenticity score like every other list.
import { MIN_SHOPS_TO_INDEX, rankShops, type PublicShop } from "../shops/present";

export type KeurmerkPage = {
  slug: string; // URL: /keurmerk/{slug}
  key: string; // value in shops.keurmerk
  name: string;
  intro: string; // what the keurmerk is; no claims about single shops
  source: string; // the keurmerk organisation's own site
};

export const KEURMERK_PAGES: KeurmerkPage[] = [
  {
    slug: "thuiswinkel-waarborg",
    key: "thuiswinkel",
    name: "Thuiswinkel Waarborg",
    intro: "Thuiswinkel Waarborg is het keurmerk van Thuiswinkel.org, de Nederlandse branchevereniging voor online winkels. Leden houden zich aan de Thuiswinkel Algemene Voorwaarden.",
    source: "https://www.thuiswinkel.org/",
  },
  {
    slug: "webwinkelkeur",
    key: "webwinkelkeur",
    name: "WebwinkelKeur",
    intro: "WebwinkelKeur is een keurmerk voor webwinkels in Nederland en België. Aangesloten shops worden gecontroleerd op hun site en voorwaarden.",
    source: "https://www.webwinkelkeur.nl/",
  },
  {
    slug: "trusted-shops",
    key: "trusted_shops",
    name: "Trusted Shops",
    intro: "Trusted Shops is een Europees keurmerk. Aangesloten shops worden gecontroleerd en kopers kunnen gebruikmaken van de kopersbescherming van Trusted Shops.",
    source: "https://www.trustedshops.nl/",
  },
];

export function keurmerkPageBySlug(slug: string): KeurmerkPage | undefined {
  return KEURMERK_PAGES.find((p) => p.slug === slug);
}

/** Published shops with this keurmerk checked at the source, best score first. */
export function keurmerkShops(page: KeurmerkPage, shops: PublicShop[]): PublicShop[] {
  return rankShops(shops.filter((s) => s.keurmerk_status === "verified" && s.keurmerk.includes(page.key)));
}

/** Pages with enough shops to be indexed (sitemap). */
export function indexableKeurmerkPages(shops: PublicShop[]): KeurmerkPage[] {
  return KEURMERK_PAGES.filter((p) => keurmerkShops(p, shops).length >= MIN_SHOPS_TO_INDEX);
}
