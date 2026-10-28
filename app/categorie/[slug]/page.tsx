import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { ShopList } from "@/components/shop-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { rankShops, shopsInCategory } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/** Plan v3 section 9: category pages with fewer than 5 shops stay out of the index. */
const MIN_SHOPS_TO_INDEX = 5;

async function load(slug: string) {
  const [categories, shops] = await Promise.all([getCategories(), getPublishedShops()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  return {
    category,
    categories,
    parent: category.parent_id ? categories.find((c) => c.id === category.parent_id) : undefined,
    children: categories.filter((c) => c.parent_id === category.id),
    shops: rankShops(shopsInCategory(shops, category, categories)),
    allShops: shops,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Categorie niet gevonden", robots: { index: false } };
  const { category, shops } = data;
  return {
    title: category.seo_title ?? `${category.name_nl}: unieke en betrouwbare webshops`,
    description: category.intro_nl ?? `De ${category.name_nl.toLowerCase()} webshops met de hoogste echtheidsscore, met keurmerk en feiten.`,
    alternates: { canonical: `${SITE.url}/categorie/${category.slug}` },
    robots: shops.length < MIN_SHOPS_TO_INDEX ? { index: false, follow: true } : undefined,
  };
}

async function CategoryDetails({ params }: Props) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { category, parent, children, shops, allShops, categories } = data;
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
      <ShopList shops={shops} listName={`Webshops in ${category.name_nl}`} />
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
