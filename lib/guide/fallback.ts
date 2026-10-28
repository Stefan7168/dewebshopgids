// Code-generated page for a week the draft did not pass the Fact Checker (plan v3 section 8
// step 12): this week's shops with their numbers only, no claims. Published, never emailed.
import type { GuideSnapshot } from "./inputs";

export function fallbackIssue(s: GuideSnapshot): { title_nl: string; intro_nl: string; body_md: string; shop_ids: string[] } {
  const week = Number(s.slug.slice(-2));
  const lines = s.shops.map((shop) =>
    [`## [${shop.name}](/webshop/${shop.slug})`, [shop.category, shop.score != null ? `echtheidsscore ${shop.score} van 100` : null, shop.online_since ? `online sinds ${shop.online_since}` : null, shop.keurmerk].filter(Boolean).join(" · ")].join("\n\n"),
  );
  return {
    title_nl: `Webshopgids week ${week}`,
    intro_nl: s.shops.length ? `Deze week ${s.shops.length} webshops uit de gids, met hun cijfers.` : "Deze week geen nieuwe webshops in de gids.",
    body_md: lines.join("\n\n") || "Volgende week staan hier weer nieuwe webshops.",
    shop_ids: s.shops.map((x) => x.id),
  };
}
