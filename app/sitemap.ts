import type { MetadataRoute } from "next";
import { liveTopics } from "@/lib/beste/topics";
import { getGuides } from "@/lib/guide/data";
import { indexableKeurmerkPages } from "@/lib/keurmerk/pages";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { MIN_SHOPS_TO_INDEX, shopsInCategory } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

// Plan v3 section 9: published shops and guides only, and only category and /beste/ pages that are indexable.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, shops, guides] = await Promise.all([getCategories(), getPublishedShops(), getGuides()]);
  const newest = shops.reduce<string | undefined>((m, s) => (!m || s.updated_at > m ? s.updated_at : m), undefined);
  return [
    { url: `${SITE.url}/`, lastModified: newest, changeFrequency: "daily", priority: 1 },
    ...["over", "hoe-wij-beoordelen", "informatie-voor-webshops", "geverifieerd", "privacy"].map((p) => ({ url: `${SITE.url}/${p}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...categories
      .filter((c) => shopsInCategory(shops, c, categories).length >= MIN_SHOPS_TO_INDEX)
      .map((c) => ({ url: `${SITE.url}/categorie/${c.slug}`, lastModified: newest, changeFrequency: "daily" as const, priority: 0.8 })),
    ...liveTopics(shops, categories).map((t) => ({ url: `${SITE.url}/beste/webshops-${t.slug}`, lastModified: newest, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...indexableKeurmerkPages(shops).map((p) => ({ url: `${SITE.url}/keurmerk/${p.slug}`, lastModified: newest, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(guides.length ? [{ url: `${SITE.url}/gids`, lastModified: guides[0].published_at ?? undefined, changeFrequency: "weekly" as const, priority: 0.7 }] : []),
    ...guides.map((g) => ({ url: `${SITE.url}/gids/${g.slug}`, lastModified: g.published_at ?? undefined, changeFrequency: "yearly" as const, priority: 0.5 })),
    { url: `${SITE.url}/informatie-voor-webshops/vragen`, changeFrequency: "monthly" as const, priority: 0.3 },
    ...shops.map((s) => ({ url: `${SITE.url}/webshop/${s.slug}`, lastModified: s.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
