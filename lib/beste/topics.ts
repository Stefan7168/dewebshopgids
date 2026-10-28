// "/beste/webshops-[topic]" lists (plan v3 section 9; pulled into the launch scope, see DECISIONS.md).
// Neutral third-party lists: the order is the authenticity score and nothing else, a page exists
// only when 15+ scored shops qualify, and every entry shows our own verified data.
// The SEO/Growth Analyst proposes new topics; a topic only goes live through a PR here.
import { scoreDisplay, rankShops, shopsInCategory, type Category, type PublicShop } from "../shops/present";

export const MIN_SHOPS_PER_LIST = 15;
/** Long enough to compare, short enough to read on a phone. */
export const MAX_SHOPS_PER_LIST = 30;

export type BesteTopic = {
  slug: string; // URL: /beste/webshops-{slug}
  categorySlug: string;
  title: string; // H1 and <title>; no year, no "updated" claims
  intro: string[]; // fixed, factual text about the list; never a claim about one shop
  /** Optional fact filter on measured data; it only removes shops, the order stays the score. */
  only?: (s: PublicShop) => boolean;
};

const COMMON =
  "Elke webshop op deze lijst hebben we zelf bekeken: hoeveel producten hij verkoopt, hoe lang het domein bestaat, of het keurmerk echt is en of hij zelf maakt of ontwerpt. Daaruit volgt een echtheidsscore van 1 tot 100. Hoe hoger, hoe meer de shop een eigen maker of specialist is en hoe minder een doorverkoper van massaproducten.";

export const TOPICS: BesteTopic[] = [
  {
    slug: "meubels",
    categorySlug: "meubels",
    title: "De meest unieke webshops voor meubels",
    intro: [
      "Op zoek naar een tafel, kast of stoel die je niet in elke woonwinkel ziet? Deze lijst toont Nederlandse meubelwebshops, gerangschikt op echtheidsscore.",
      COMMON,
      "Let bij meubels vooral op de herkomst: een werkplaats of eigen ontwerp zegt meer dan een groot assortiment. Bij elke shop zie je de zin van zijn eigen site waar de punten op gebaseerd zijn.",
    ],
  },
  {
    slug: "verlichting",
    categorySlug: "verlichting",
    title: "De meest unieke webshops voor verlichting",
    intro: [
      "Lampen bepalen hoe een kamer voelt. Deze lijst toont Nederlandse webshops voor verlichting, gerangschikt op echtheidsscore.",
      COMMON,
      "Veel lampen online komen uit dezelfde fabrieken onder andere namen. Shops die zelf ontwerpen of in kleine series maken, scoren hier hoger.",
    ],
  },
  {
    slug: "woontextiel",
    categorySlug: "woontextiel",
    title: "De meest unieke webshops voor woontextiel",
    intro: [
      "Kussens, plaids, gordijnen en vloerkleden: deze lijst toont Nederlandse webshops voor woontextiel, gerangschikt op echtheidsscore.",
      COMMON,
      "Bij textiel is herkomst goed te controleren: staat er op de site waar en door wie het geweven of genaaid is? Die zinnen zie je bij elke shop terug.",
    ],
  },
  {
    slug: "woonaccessoires",
    categorySlug: "woonaccessoires",
    title: "De meest unieke webshops voor woonaccessoires",
    intro: [
      "Vazen, kaarsen, spiegels en ander klein interieur: deze lijst toont Nederlandse webshops voor woonaccessoires, gerangschikt op echtheidsscore.",
      COMMON,
      "In deze categorie zijn veel shops die hetzelfde aanbod doorverkopen. Een kleine, duidelijke collectie en een eigen atelier tellen daarom zwaar mee.",
    ],
  },
  {
    slug: "keuken-en-tafelen",
    categorySlug: "keuken-tafelen",
    title: "De meest unieke webshops voor keuken en tafelen",
    intro: [
      "Servies, glaswerk, snijplanken en tafellinnen: deze lijst toont Nederlandse webshops voor keuken en tafelen, gerangschikt op echtheidsscore.",
      COMMON,
      "Handgemaakt keramiek en hout uit eigen werkplaats geven hier de meeste punten. Bij elke shop zie je waar dat op de site staat.",
    ],
  },
  {
    slug: "slapen",
    categorySlug: "slapen",
    title: "De meest unieke webshops voor slapen",
    intro: [
      "Een bed, matras, dekbed of beddengoed koop je voor jaren. Deze lijst toont Nederlandse webshops voor slapen, gerangschikt op echtheidsscore.",
      COMMON,
      "Bij slapen draait veel om materiaal en afwerking. Shops die zelf vullen, naaien of in eigen werkplaats maken, scoren hier hoger dan doorverkopers van dezelfde merken.",
    ],
  },
  {
    slug: "tuin-en-buiten",
    categorySlug: "tuin-buiten",
    title: "De meest unieke webshops voor tuin en buiten",
    intro: [
      "Tuinmeubels, plantenbakken, vuurschalen en buitenverlichting: deze lijst toont Nederlandse webshops voor tuin en buiten, gerangschikt op echtheidsscore.",
      COMMON,
      "Buitenspullen moeten tegen weer en wind. Een eigen werkplaats of een duidelijke herkomst van hout en staal zegt hier veel; bij elke shop zie je waar dat op de site staat.",
    ],
  },
  {
    slug: "met-showroom",
    categorySlug: "wonen",
    title: "Unieke woonwebshops met een winkel of showroom",
    intro: [
      "Wil je een bank, tafel of lamp eerst zien en voelen? Deze lijst toont Nederlandse woonwebshops die ook een fysieke winkel of showroom hebben, gerangschikt op echtheidsscore.",
      COMMON,
      "Een shop staat hier alleen als zijn eigen site een winkel of showroom noemt. Noemt de site ook de plaats, dan zie je die op de pagina van de shop.",
    ],
    only: (s) => s.has_physical_store === true,
  },
  {
    slug: "met-keurmerk",
    categorySlug: "wonen",
    title: "Unieke woonwebshops met een gecontroleerd keurmerk",
    intro: [
      "Een keurmerk geeft extra zekerheid bij retouren en betalen. Deze lijst toont Nederlandse woonwebshops waarvan we het keurmerk zelf hebben gecontroleerd, gerangschikt op echtheidsscore.",
      COMMON,
      "We tellen een keurmerk alleen als de site van de keurmerkorganisatie de webshop zelf noemt. Een logo op de site alleen is niet genoeg.",
    ],
    only: (s) => s.keurmerk_status === "verified",
  },
];

export function topicBySlug(urlSlug: string): BesteTopic | undefined {
  if (!urlSlug.startsWith("webshops-")) return undefined;
  return TOPICS.find((t) => t.slug === urlSlug.slice("webshops-".length));
}

/** Published shops in the topic's category with a numeric score, best first. Null when fewer than 15 qualify. */
export function besteList(topic: BesteTopic, shops: PublicShop[], categories: Category[]): PublicShop[] | null {
  const category = categories.find((c) => c.slug === topic.categorySlug);
  if (!category) return null;
  const scored = shopsInCategory(shops, category, categories).filter(
    (s) => scoreDisplay(s).kind === "number" && (topic.only?.(s) ?? true),
  );
  if (scored.length < MIN_SHOPS_PER_LIST) return null;
  return rankShops(scored).slice(0, MAX_SHOPS_PER_LIST);
}

/** Topics that have a page right now (used by the sitemap and llms.txt). */
export function liveTopics(shops: PublicShop[], categories: Category[]): BesteTopic[] {
  return TOPICS.filter((t) => besteList(t, shops, categories) !== null);
}
