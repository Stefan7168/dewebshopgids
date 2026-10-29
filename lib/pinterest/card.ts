// Per-pin images (QA round 3, L3): every pin gets its own 2:3 image instead of the site's share
// image. The image is drawn from public facts only: page title, category, score. No personal names.
import type { PublicGuide } from "../guide/data";
import { topicBySlug } from "../beste/topics";
import { scoreDisplay, type Category, type PublicShop } from "../shops/present";

export const PIN_SIZE = { width: 1000, height: 1500 };

/** Where the image for a pin draft's target page lives: /webshop/x becomes /pin/webshop/x. */
export function pinImagePath(targetPath: string): string {
  return `/pin${targetPath}`;
}

export type PinCard = { kicker: string; title: string; line: string; score: number | null };

export type PinData = { shop?: PublicShop | null; guide?: PublicGuide | null; categories: Category[] };

/** The words on the image for one target page; null when the page does not exist (yet). */
export function pinCard(kind: string, slug: string, d: PinData): PinCard | null {
  if (kind === "webshop") {
    if (!d.shop) return null;
    const score = scoreDisplay(d.shop);
    const cat = d.categories.find((c) => c.id === d.shop!.category_id)?.name_nl ?? "Webshop";
    return { kicker: cat, title: d.shop.name, line: d.shop.domain, score: score.kind === "number" ? score.value : null };
  }
  if (kind === "beste") {
    const topic = topicBySlug(slug);
    return topic ? { kicker: "Lijst", title: topic.title, line: "Gerangschikt op echtheidsscore", score: null } : null;
  }
  if (kind === "gids") {
    if (!d.guide) return null;
    return { kicker: `Webshopgids · week ${d.guide.iso_week}`, title: d.guide.title_nl ?? `Webshopgids week ${d.guide.iso_week}`, line: "Elke week 5 unieke webshops", score: null };
  }
  if (kind === "categorie") {
    const c = d.categories.find((x) => x.slug === slug);
    return c ? { kicker: "Categorie", title: c.name_nl, line: "Unieke en betrouwbare webshops", score: null } : null;
  }
  return null;
}
