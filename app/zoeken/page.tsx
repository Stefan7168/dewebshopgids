import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopList } from "@/components/shop-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MAX_QUERY_LENGTH, searchShops } from "@/lib/search/shops";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { PageLoading } from "@/components/page-loading";

export const metadata: Metadata = { title: "Zoeken", robots: { index: false, follow: true } };

type Props = { searchParams: Promise<{ q?: string | string[] }> };

async function Results({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").slice(0, MAX_QUERY_LENGTH);
  const [shops, categories] = await Promise.all([getPublishedShops(), getCategories()]);
  const hits = searchShops(q, shops, categories);
  return (
    <>
      <form action="/zoeken" method="get" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">Zoek een webshop</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={MAX_QUERY_LENGTH}
          placeholder="Bijvoorbeeld: keramiek of lampen"
          className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-foreground"
        />
        <button type="submit" className="h-11 rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90">
          Zoek
        </button>
      </form>
      {q.trim() &&
        (hits.length ? (
          <ShopList shops={hits} listName={`Zoekresultaten voor ${q}`} />
        ) : (
          <p className="text-muted-foreground">Geen webshops gevonden. Probeer een ander woord, zoals een product of materiaal.</p>
        ))}
    </>
  );
}

export default function SearchPage(props: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Zoek een webshop</h1>
        <Suspense fallback={<PageLoading />}>
          <Results {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
