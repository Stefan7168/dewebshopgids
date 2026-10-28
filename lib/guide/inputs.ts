// The frozen data of one gids issue (guide_issues.inputs_snapshot). Code picks up to 5 shops
// (plan v3 section 2.6): newly published in the window, then the biggest score rise, then the
// most clicked shops never featured before. The agents may use only these facts.
export const GUIDE_SHOPS = 5;

export type GuideCandidate = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  score: number | null;
  score_label: string | null;
  keurmerk: string;
  online_since: string | null;
  products: string | null;
  city: string | null;
  description: string | null;
  first_published_at: string | null;
  score_before: number | null; // newest score before the window
  clicks: number; // in the window
  featured_before: boolean;
};

export type GuideShop = Omit<GuideCandidate, "first_published_at" | "score_before" | "featured_before"> & {
  reason: "nieuw" | "score_gestegen" | "veel_bekeken";
  score_change: number | null;
};

export type GuideSnapshot = {
  slug: string;
  window: { start: string; end: string };
  shops: GuideShop[];
};

const shown = (c: GuideCandidate) => c.score != null && !c.score_label; // only shops with a visible number

export function pickGuideShops(all: GuideCandidate[], windowStart: Date, windowEnd: Date): GuideShop[] {
  const picked: GuideShop[] = [];
  const take = (c: GuideCandidate, reason: GuideShop["reason"]) => {
    if (picked.length >= GUIDE_SHOPS || picked.some((p) => p.id === c.id)) return;
    picked.push({
      id: c.id, slug: c.slug, name: c.name, category: c.category, score: c.score, score_label: c.score_label,
      keurmerk: c.keurmerk, online_since: c.online_since, products: c.products, city: c.city, description: c.description,
      clicks: c.clicks, reason, score_change: c.score_before != null && c.score != null ? c.score - c.score_before : null,
    });
  };
  const inWindow = (iso: string | null) => !!iso && new Date(iso) >= windowStart && new Date(iso) < windowEnd;
  const byName = (a: GuideCandidate, b: GuideCandidate) => a.name.localeCompare(b.name, "nl");

  all.filter((c) => shown(c) && inWindow(c.first_published_at))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || byName(a, b))
    .forEach((c) => take(c, "nieuw"));
  all.filter((c) => shown(c) && c.score_before != null && c.score! > c.score_before)
    .sort((a, b) => b.score! - b.score_before! - (a.score! - a.score_before!) || byName(a, b))
    .forEach((c) => take(c, "score_gestegen"));
  all.filter((c) => shown(c) && !c.featured_before && c.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks || byName(a, b))
    .forEach((c) => take(c, "veel_bekeken"));
  return picked;
}
