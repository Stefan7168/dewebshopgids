import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { FeaturedBlock } from "@/components/featured-block";
import { ShopFilterBar } from "@/components/shop-filters";
import { ShopList } from "@/components/shop-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { featuredFor } from "@/lib/featured/select";
import { getCategories, getFeaturedPlacements, getPublishedShops } from "@/lib/shops/data";
import { applyFilters, hasFilters, parseFilters } from "@/lib/shops/filters";
import { MIN_SHOPS_TO_INDEX, rankShops, shopsInCategory } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(slug: string) {
  const [categories, shops, placements] = await Promise.all([getCategories(), getPublishedShops(), getFeaturedPlacements()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  return {
    category,
    categories,
    parent: category.parent_id ? categories.find((c) => c.id === category.parent_id) : undefined,
    children: categories.filter((c) => c.parent_id === category.id),
    shops: rankShops(shopsInCategory(shops, category, categories)),
    allShops: shops,
    featured: featuredFor(category, shops, placements),
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Categorie niet gevonden", robots: { index: false } };
  const { category, shops } = data;
  const filtered = hasFilters(parseFilters(await searchParams));
  return {
    title: category.seo_title ?? `${category.name_nl}: unieke en betrouwbare webshops`,
    description: category.intro_nl ?? `Webshops in ${category.name_nl.toLowerCase()} met de hoogste echtheidsscore, met keurmerk en feiten per shop.`,
    alternates: { canonical: `${SITE.url}/categorie/${category.slug}` },
    // A filtered view is not a separate page for search engines; the canonical is the full list.
    robots: filtered || shops.length < MIN_SHOPS_TO_INDEX ? { index: false, follow: true } : undefined,
  };
}

async function CategoryDetails({ params, searchParams }: Props) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { category, parent, children, shops, allShops, categories, featured } = data;
  const filters = parseFilters(await searchParams);
  const shown = applyFilters(shops, filters);
  const crumbs = [parent, category].filter((c) => c !== undefined);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Kruimelpad" className="text-sm text-muted-foreground flex flex-wrap gap-1">
        <Link href="/" className="underline">Home</Link>
        {parent && (
          <span>
            / <Link href={`/categorie/${parent.slug}`} className="underline">{parent.name_nl}</Link>
          </span>
        )}
      </nav>
      <h1 className="text-2xl font-bold">{category.name_nl}</h1>
      {category.intro_nl && <p>{category.intro_nl}</p>}
      {children.length > 0 && (
        <nav aria-label="Subcategorieën" className="flex flex-wrap gap-2">
          {children.map((c) => (
            <Link key={c.id} href={`/categorie/${c.slug}`} className="rounded-full border px-3 py-2 text-sm hover:bg-muted">
              {c.name_nl} ({shopsInCategory(allShops, c, categories).length})
            </Link>
          ))}
        </nav>
      )}
      <FeaturedBlock shops={featured} />
      {shops.length > 0 && (
        <ShopFilterBar path={`/categorie/${category.slug}`} filters={filters} shown={shown.length} total={shops.length} />
      )}
      {shops.length > 0 && shown.length === 0 ? (
        <p className="text-muted-foreground">Geen webshops met deze filters. Zet een filter uit om meer te zien.</p>
      ) : (
        <ShopList shops={shown} listName={`Webshops in ${category.name_nl}`} />
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
            ...crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.name_nl, item: `${SITE.url}/categorie/${c.slug}` })),
          ],
        }}
      />
    </div>
  );
}

export default function CategoryPage(props: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <Suspense fallback={<p className="text-muted-foreground">Laden...</p>}>
          <CategoryDetails {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
