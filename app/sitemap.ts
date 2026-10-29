import type { MetadataRoute } from "next";
import { liveTopics } from "@/lib/beste/topics";
import { getGuides } from "@/lib/guide/data";
import { indexableKeurmerkPages, keurmerkShops } from "@/lib/keurmerk/pages";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { newestUpdate, sitemapCategories } from "@/lib/seo/sitemap";
import { shopsInCategory } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

// Plan v3 section 9: published shops and guides only, and only category and /beste/ pages that are indexable.
// Hidden main categories (under 30 shops) and their lists stay out. lastmod is the newest shop update on the page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, shops, guides] = await Promise.all([getCategories(), getPublishedShops(), getGuides()]);
  const listed = sitemapCategories(categories, shops);
  const lastmod = (slug: string) => newestUpdate(shopsInCategory(shops, listed.find((c) => c.slug === slug)!, categories));
  const newest = newestUpdate(shops);
  return [
    { url: `${SITE.url}/`, lastModified: newest, changeFrequency: "daily", priority: 1 },
    ...["over", "hoe-wij-beoordelen", "informatie-voor-webshops", "geverifieerd", "privacy"].map((p) => ({ url: `${SITE.url}/${p}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ...categories
      .filter((c) => listed.includes(c))
      .map((c) => ({ url: `${SITE.url}/categorie/${c.slug}`, lastModified: lastmod(c.slug), changeFrequency: "daily" as const, priority: 0.8 })),
    ...liveTopics(shops, categories)
      .filter((t) => listed.some((c) => c.slug === t.categorySlug))
      .map((t) => ({ url: `${SITE.url}/beste/webshops-${t.slug}`, lastModified: lastmod(t.categorySlug), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...indexableKeurmerkPages(shops).map((p) => ({ url: `${SITE.url}/keurmerk/${p.slug}`, lastModified: newestUpdate(keurmerkShops(p, shops)), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(guides.length ? [{ url: `${SITE.url}/gids`, lastModified: guides[0].published_at ?? undefined, changeFrequency: "weekly" as const, priority: 0.7 }] : []),
    ...guides.map((g) => ({ url: `${SITE.url}/gids/${g.slug}`, lastModified: g.published_at ?? undefined, changeFrequency: "yearly" as const, priority: 0.5 })),
    ...shops.map((s) => ({ url: `${SITE.url}/webshop/${s.slug}`, lastModified: s.updated_at, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
