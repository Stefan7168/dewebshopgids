import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { ShopList } from "@/components/shop-list";
import { ScoreBadge } from "@/components/score-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { KEURMERK_PAGES } from "@/lib/keurmerk/pages";
import { signupHeadline } from "@/lib/newsletter/core";
import { cachedToday, getCategories, getPublishedShops, getShop } from "@/lib/shops/data";
import { getEarnedSubScores } from "@/lib/shops/evidence";
import { countryName, hasVerifiedBadge, keurmerkText, onlineSince, priceLevelText, productCountText, scoreDisplay, similarShops, SUB_SCORE_NAMES, type Category, type PublicShop } from "@/lib/shops/present";
import { SITE } from "@/lib/site";
import { PageLoading } from "@/components/page-loading";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getShop((await params).slug);
  if (!shop) return { title: "Webshop niet gevonden", robots: { index: false } };
  return {
    title: `${shop.name}: echtheidsscore, keurmerk en feiten`,
    description: shop.description_nl ?? `Echtheidsscore, keurmerk en feiten over ${shop.domain}.`,
    alternates: { canonical: `${SITE.url}/webshop/${shop.slug}` },
  };
}

async function EarnedSubScores({ shop }: { shop: PublicShop }) {
  if (scoreDisplay(shop).kind !== "number") return null;
  const earned = await getEarnedSubScores(shop.id);
  if (earned.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Waar de punten vandaan komen</h2>
      <ul className="flex flex-col gap-3">
        {earned.map((e) => (
          <li key={e.key} className="rounded-lg border p-4 flex flex-col gap-2">
            <div className="flex justify-between gap-4 font-medium">
              <span>{SUB_SCORE_NAMES[e.key]}</span>
              <span>
                {e.points} van {e.max}
              </span>
            </div>
            {e.evidence.map((q) => (
              <blockquote key={q.quote} className="border-l-2 pl-3 text-sm">
                &ldquo;{q.quote}&rdquo;
                {q.url && (
                  <span className="block text-xs text-muted-foreground break-all">
                    Bron: <a href={q.url} rel="nofollow noopener" className="underline">{q.url}</a>
                  </span>
                )}
              </blockquote>
            ))}
            {e.evidence.length === 0 && e.key === "scale" && <p className="text-sm text-muted-foreground">{productCountText(shop.product_count_est)}, geteld op de site.</p>}
            {e.evidence.length === 0 && e.key === "identity" && <p className="text-sm text-muted-foreground">Het KvK-nummer staat op de site.</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

async function SimilarShops({ shop, categories }: { shop: PublicShop; categories: Category[] }) {
  const similar = similarShops(shop, await getPublishedShops(), categories);
  if (similar.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Vergelijkbare webshops</h2>
      <ShopList shops={similar} listName={`Vergelijkbare webshops voor ${shop.name}`} />
    </section>
  );
}

async function ShopDetails({ params }: Props) {
  const { slug } = await params;
  const [shop, today] = await Promise.all([getShop(slug), cachedToday()]);
  if (!shop) notFound();
  const categories = await getCategories();
  const category = categories.find((c) => c.id === shop.category_id);
  const parent = category?.parent_id ? categories.find((c) => c.id === category.parent_id) : undefined;
  const crumbs = [parent, category].filter((c) => c !== undefined);

  const facts: [string, string | null][] = [
    ["Online sinds", onlineSince(shop.domain_first_seen)],
    ["Assortiment", productCountText(shop.product_count_est)],
    ["Keurmerk", keurmerkText(shop)],
    ["Prijsniveau", priceLevelText(shop.price_level)],
    ["Winkel", shop.has_physical_store ? (shop.store_city ? `Fysieke winkel in ${shop.store_city}` : "Heeft een fysieke winkel") : null],
    ["Verzendt vanuit", countryName(shop.ships_from_country)],
  ];

  return (
    <article className="flex flex-col gap-6">
      <nav aria-label="Kruimelpad" className="text-sm text-muted-foreground flex flex-wrap gap-1">
        <Link href="/" className="underline">Home</Link>
        {crumbs.map((c) => (
          <span key={c.id}>
            / <Link href={`/categorie/${c.slug}`} className="underline">{c.name_nl}</Link>
          </span>
        ))}
      </nav>
      <div className="flex gap-4 items-start">
        <ScoreBadge shop={shop} size="lg" />
        <div className="min-w-0 flex flex-col gap-1">
          <h1 className="text-2xl font-bold break-words">{shop.name}</h1>
          <p className="text-muted-foreground break-words">{shop.domain}</p>
          {scoreDisplay(shop).kind !== "label" && <p className="text-sm text-muted-foreground">Echtheidsscore van 1 tot 100</p>}
          {hasVerifiedBadge(shop, today) && (
            <p className="text-sm">
              <span className="rounded-full border px-2 py-0.5 font-medium">Geverifieerd</span>{" "}
              <span className="text-muted-foreground">
                Deze shop betaalt voor de badge. Dat verandert niets aan de score of de volgorde.
              </span>
            </p>
          )}
        </div>
      </div>
      {shop.description_nl && <p>{shop.description_nl}</p>}
      <div className="flex flex-col gap-2">
        <a
          href={`/go/${shop.slug}`}
          rel="sponsored nofollow"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Naar de webshop
        </a>
        <p className="text-xs text-muted-foreground">
          Wij ontvangen soms een vergoeding als je via onze links iets koopt. Dat heeft geen invloed op de score of de volgorde.
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Feiten</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {facts
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        {shop.keurmerk_status === "verified" &&
          KEURMERK_PAGES.filter((p) => shop.keurmerk.includes(p.key)).map((p) => (
            <Link key={p.slug} href={`/keurmerk/${p.slug}`} className="text-sm underline">
              Meer webshops met {p.name}
            </Link>
          ))}
      </section>
      <Suspense fallback={null}>
        <EarnedSubScores shop={shop} />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        {shop.status === "disputed" ? "Deze score wordt opnieuw beoordeeld na een vraag over de gegevens." : "Klopt er iets niet?"}{" "}
        <Link href={`/herbeoordeling?shop=${shop.slug}`} rel="nofollow" className="underline">
          Vraag een herbeoordeling aan
        </Link>
        {" of laat deze webshop verwijderen."}
      </p>
      <p className="text-sm text-muted-foreground">
        Is dit jouw webshop?{" "}
        <Link href={`/beheer?shop=${shop.slug}`} rel="nofollow" className="underline">
          Pas je beschrijving aan
        </Link>
        .
      </p>
      <Suspense fallback={null}>
        <SimilarShops shop={shop} categories={categories} />
      </Suspense>
      <NewsletterForm headline={signupHeadline()} source={`/webshop/${shop.slug}`} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
            ...crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 2, name: c.name_nl, item: `${SITE.url}/categorie/${c.slug}` })),
            { "@type": "ListItem", position: crumbs.length + 2, name: shop.name, item: `${SITE.url}/webshop/${shop.slug}` },
          ],
        }}
      />
    </article>
  );
}

export default function ShopPage(props: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <Suspense fallback={<PageLoading />}>
          <ShopDetails {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
