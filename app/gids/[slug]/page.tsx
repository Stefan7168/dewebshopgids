import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GuideBody } from "@/components/guide-body";
import { GuideNav } from "@/components/guide-nav";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { ScoreBadge } from "@/components/score-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getGuide } from "@/lib/guide/data";
import { parseGuideSlug } from "@/lib/guide/week";
import { signupHeadline } from "@/lib/newsletter/core";
import { getPublishedShops } from "@/lib/shops/data";
import { SITE } from "@/lib/site";
import { PageLoading } from "@/components/page-loading";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = parseGuideSlug(slug) ? await getGuide(slug) : null;
  if (!g) return { title: "Gids niet gevonden", robots: { index: false } };
  return {
    title: g.title_nl ?? `Webshopgids week ${g.iso_week}`,
    description: g.intro_nl ?? `De webshopgids van week ${g.iso_week}, ${g.iso_year}.`,
    alternates: { canonical: `${SITE.url}/gids/${g.slug}` },
  };
}

async function Guide({ params }: Props) {
  const { slug } = await params;
  const g = parseGuideSlug(slug) ? await getGuide(slug) : null;
  if (!g) notFound();
  // In the order the editor chose, which is the order the body mentions them.
  const shops = (await getPublishedShops())
    .filter((s) => g.shop_ids.includes(s.id))
    .sort((a, b) => g.shop_ids.indexOf(a.id) - g.shop_ids.indexOf(b.id));
  return (
    <article className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/gids" className="underline">Webshopgids</Link> · week {g.iso_week}, {g.iso_year}
      </p>
      <h1 className="text-2xl font-bold md:text-3xl">{g.title_nl}</h1>
      {g.intro_nl ? <p className="max-w-prose text-lg md:text-xl">{g.intro_nl}</p> : null}
      <GuideBody md={g.body_md ?? ""} liveShops={new Set((await getPublishedShops()).map((s) => s.slug))} />
      {shops.length ? (
        <section className="flex flex-col gap-3" aria-label="Webshops in deze gids">
          <h2 className="text-xl font-semibold">De webshops van deze week</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {shops.map((s) => (
              <li key={s.id} className="rounded-lg border p-4 flex gap-4 items-start">
                <ScoreBadge shop={s} />
                <div className="min-w-0">
                  <Link href={`/webshop/${s.slug}`} className="font-semibold underline">{s.name}</Link>
                  <p className="text-sm text-muted-foreground break-words">{s.domain}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Alle cijfers komen uit onze eigen controle van de webshops. <Link href="/hoe-wij-beoordelen" className="underline">Zo beoordelen we</Link>.
      </p>
      <NewsletterForm headline={signupHeadline()} source={`/gids/${g.slug}`} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: g.title_nl ?? `Webshopgids week ${g.iso_week}`,
              ...(g.intro_nl ? { description: g.intro_nl } : {}),
              ...(g.published_at ? { datePublished: g.published_at } : {}),
              inLanguage: "nl-NL",
              url: `${SITE.url}/gids/${g.slug}`,
              publisher: { "@type": "Organization", name: SITE.legalName ?? SITE.name, url: `${SITE.url}/` },
              mentions: shops.map((s) => ({ "@type": "WebPage", name: s.name, url: `${SITE.url}/webshop/${s.slug}` })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
                { "@type": "ListItem", position: 2, name: "Webshopgids", item: `${SITE.url}/gids` },
                { "@type": "ListItem", position: 3, name: `Week ${g.iso_week}, ${g.iso_year}`, item: `${SITE.url}/gids/${g.slug}` },
              ],
            },
          ],
        }}
      />
      <Suspense fallback={null}>
        <GuideNav slug={g.slug} />
      </Suspense>
    </article>
  );
}

export default function GuidePage(props: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <Suspense fallback={<PageLoading />}>
          <Guide {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
