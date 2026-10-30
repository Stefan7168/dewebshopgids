// "/beste/webshops-[topic]" lists (plan v3 section 9; pulled into the launch scope, see DECISIONS.md).
// Neutral third-party lists: the order is the authenticity score and nothing else, a page exists
// only when 15+ scored shops qualify, and every entry shows our own verified data.
// The SEO/Growth Analyst proposes new topics; a topic only goes live through a PR here.
import { TOPIC_CONTENT, type TopicContent } from "./content";
import { scoreDisplay, rankShops, shopsInCategory, type Category, type PublicShop } from "../shops/present";

export const MIN_SHOPS_PER_LIST = 15;
/** Long enough to compare, short enough to read on a phone. */
export const MAX_SHOPS_PER_LIST = 30;

type TopicBase = {
  slug: string; // URL: /beste/webshops-{slug}
  categorySlug: string;
  title: string; // H1 and <title>; no year, no "updated" claims
  /** Optional fact filter on measured data; it only removes shops, the order stays the score. */
  only?: (s: PublicShop) => boolean;
};

/** Intro, FAQ and target search phrase live in content.ts. */
export type BesteTopic = TopicBase & TopicContent;

/** Shown on every list after the intro: how we look at a shop. */
export const METHOD_NOTE =
  "Elke webshop op deze lijst hebben we zelf bekeken: hoeveel producten hij verkoopt, hoe lang het domein bestaat, of het keurmerk echt is en of hij zelf maakt of ontwerpt. Daaruit volgt een echtheidsscore van 1 tot 100. Hoe hoger, hoe meer de shop een eigen maker of specialist is en hoe minder een doorverkoper van massaproducten.";

const BASE: TopicBase[] = [
  {
    slug: "meubels",
    categorySlug: "meubels",
    title: "De meest unieke webshops voor meubels",
  },
  {
    slug: "verlichting",
    categorySlug: "verlichting",
    title: "De meest unieke webshops voor verlichting",
  },
  {
    slug: "woontextiel",
    categorySlug: "woontextiel",
    title: "De meest unieke webshops voor woontextiel",
  },
  {
    slug: "woonaccessoires",
    categorySlug: "woonaccessoires",
    title: "De meest unieke webshops voor woonaccessoires",
  },
  {
    slug: "keuken-en-tafelen",
    categorySlug: "keuken-tafelen",
    title: "De meest unieke webshops voor keuken en tafelen",
  },
  {
    slug: "slapen",
    categorySlug: "slapen",
    title: "De meest unieke webshops voor slapen",
  },
  {
    slug: "tuin-en-buiten",
    categorySlug: "tuin-buiten",
    title: "De meest unieke webshops voor tuin en buiten",
  },
  {
    slug: "tuinmeubels",
    categorySlug: "tuinmeubels",
    title: "De meest unieke webshops voor tuinmeubels",
  },
  {
    slug: "potten-en-plantenbakken",
    categorySlug: "potten-plantenbakken",
    title: "De meest unieke webshops voor potten en plantenbakken",
  },
  {
    slug: "buitenverlichting",
    categorySlug: "buitenverlichting",
    title: "De meest unieke webshops voor buitenverlichting",
  },
  {
    slug: "vuurschalen-en-bbq",
    categorySlug: "vuur-bbq",
    title: "De meest unieke webshops voor vuurschalen en bbq",
  },
  {
    slug: "eten-en-drinken",
    categorySlug: "eten-drinken",
    title: "De meest unieke webshops voor eten en drinken",
  },
  {
    slug: "koffie-en-thee",
    categorySlug: "koffie-thee",
    title: "De meest unieke webshops voor koffie en thee",
  },
  {
    slug: "chocolade",
    categorySlug: "chocolade-koek",
    title: "De meest unieke webshops voor chocolade",
  },
  {
    slug: "kaas-en-delicatessen",
    categorySlug: "kaas-delicatessen",
    title: "De meest unieke webshops voor kaas en delicatessen",
  },
  {
    slug: "sieraden-en-accessoires",
    categorySlug: "sieraden-accessoires",
    title: "De meest unieke webshops voor sieraden en accessoires",
  },
  {
    slug: "handgemaakte-sieraden",
    categorySlug: "sieraden",
    title: "De meest unieke webshops voor handgemaakte sieraden",
  },
  {
    slug: "leren-tassen",
    categorySlug: "tassen-leer",
    title: "De meest unieke webshops voor leren tassen",
  },
  {
    slug: "met-showroom",
    categorySlug: "wonen",
    title: "Unieke woonwebshops met een winkel of showroom",
    only: (s) => s.has_physical_store === true,
  },
  {
    slug: "met-keurmerk",
    categorySlug: "wonen",
    title: "Unieke woonwebshops met een gecontroleerd keurmerk",
    only: (s) => s.keurmerk_status === "verified",
  },
  {
    // Coordinator decision 2026-10-30. The tag is hand-checked against the shop's own site (shop_tags, 0025).
    slug: "vintage-interieur",
    categorySlug: "wonen",
    title: "Webshops voor vintage interieur",
    only: (s) => s.tags?.includes("vintage") === true,
  },
  {
    // Coordinator backlog round 2, 2026-10-30. Tag hand-checked on the shop's own site (shop_tags, 0025).
    slug: "handgemaakt-servies",
    categorySlug: "keuken-tafelen",
    title: "Webshops voor handgemaakt servies",
    only: (s) => s.tags?.includes("handgemaakt-servies") === true,
  },
];

export const TOPICS: BesteTopic[] = BASE.map((t) => ({ ...t, ...TOPIC_CONTENT[t.slug] }));

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

function rootSlug(slug: string, categories: Category[]): string | undefined {
  let c = categories.find((x) => x.slug === slug);
  while (c?.parent_id) c = categories.find((x) => x.id === c!.parent_id);
  return c?.slug;
}

/** Other live lists under the same root category, for the internal link block. Never the topic itself. */
export function siblingTopics(topic: BesteTopic, live: BesteTopic[], categories: Category[]): BesteTopic[] {
  const root = rootSlug(topic.categorySlug, categories);
  return live.filter((t) => t.slug !== topic.slug && rootSlug(t.categorySlug, categories) === root);
}
