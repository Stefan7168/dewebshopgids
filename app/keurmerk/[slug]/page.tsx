import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopList } from "@/components/shop-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { keurmerkPageBySlug, keurmerkShops } from "@/lib/keurmerk/pages";
import { getPublishedShops } from "@/lib/shops/data";
import { MIN_SHOPS_TO_INDEX } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const page = keurmerkPageBySlug(slug);
  if (!page) return null;
  return { page, shops: keurmerkShops(page, await getPublishedShops()) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Keurmerk niet gevonden", robots: { index: false } };
  const { page, shops } = data;
  return {
    title: `Webshops met ${page.name}, gecontroleerd`,
    description: `Nederlandse Home & Living webshops waarvan we het ${page.name}-keurmerk zelf hebben gecontroleerd, gerangschikt op echtheidsscore.`,
    alternates: { canonical: `${SITE.url}/keurmerk/${page.slug}` },
    robots: shops.length < MIN_SHOPS_TO_INDEX ? { index: false, follow: true } : undefined,
  };
}

async function KeurmerkDetails({ params }: Props) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { page, shops } = data;
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Kruimelpad" className="text-sm text-muted-foreground">
        <Link href="/" className="underline">Home</Link> / Keurmerk
      </nav>
      <h1 className="text-2xl font-bold">Webshops met {page.name}</h1>
      <p>{page.intro}</p>
      <p className="text-sm">
        Een shop staat hier alleen als we het keurmerk zelf hebben opgezocht bij {page.name}. Alleen een logo op de site is niet genoeg.
        Meer over het keurmerk lees je op{" "}
        <a href={page.source} className="underline" rel="noopener">
          {new URL(page.source).hostname}
        </a>
        .
      </p>
      <ShopList shops={shops} listName={`Webshops met ${page.name}`} />
      <p className="text-sm">
        <Link href="/hoe-wij-beoordelen" className="underline">Hoe we keurmerken controleren</Link>
      </p>
    </div>
  );
}

export default function KeurmerkPage(props: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <Suspense fallback={<p className="text-muted-foreground">Laden...</p>}>
          <KeurmerkDetails {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
