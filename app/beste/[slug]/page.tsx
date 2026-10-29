import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { RankingDisclosure } from "@/components/ranking-disclosure";
import { ScoreBadge } from "@/components/score-badge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FaqSection } from "@/components/faq-section";
import { METHOD_NOTE, besteList, liveTopics, siblingTopics, topicBySlug } from "@/lib/beste/topics";
import { signupHeadline } from "@/lib/newsletter/core";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { getEarnedSubScores } from "@/lib/shops/evidence";
import { keurmerkText, onlineSince, productCountText, rankingExplanation, SUB_SCORE_NAMES, type PublicShop } from "@/lib/shops/present";
import { SITE } from "@/lib/site";
import { PageLoading } from "@/components/page-loading";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const topic = topicBySlug(slug);
  if (!topic) return null;
  const [categories, shops] = await Promise.all([getCategories(), getPublishedShops()]);
  const list = besteList(topic, shops, categories);
  if (!list) return null;
  const siblings = siblingTopics(topic, liveTopics(shops, categories), categories);
  return { topic, list, siblings, category: categories.find((c) => c.slug === topic.categorySlug)! };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Lijst niet gevonden", robots: { index: false } };
  return {
    title: data.topic.title,
    description: `${data.list.length} Nederlandse webshops voor ${data.category.name_nl.toLowerCase()}, gerangschikt op echtheidsscore. Met keurmerkcontrole en de bron van elke score.`,
    alternates: { canonical: `${SITE.url}/beste/${slug}` },
  };
}

/** One verified quote from the shop's own site: the evidence behind its highest earned sub-score. */
async function Evidence({ shop }: { shop: PublicShop }) {
  const earned = await getEarnedSubScores(shop.id);
  const best = [...earned].sort((a, b) => b.points - a.points).find((e) => e.evidence.length > 0);
  if (!best) return null;
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{SUB_SCORE_NAMES[best.key]}: </span>&ldquo;{best.evidence[0].quote}&rdquo;
    </p>
  );
}

async function List({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { topic, list, siblings, category } = data;
  return (
    <article className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{topic.title}</h1>
      {topic.intro.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p className="text-sm text-muted-foreground">{METHOD_NOTE}</p>
      <section className="flex flex-col gap-3" aria-label={topic.title}>
        <RankingDisclosure />
        <ol className="flex flex-col gap-3">
          {list.map((s, i) => {
            const facts = [onlineSince(s.domain_first_seen) ? `Online sinds ${onlineSince(s.domain_first_seen)}` : null, productCountText(s.product_count_est), keurmerkText(s)].filter(Boolean);
            return (
              <li key={s.id} className="rounded-lg border p-4 flex flex-col gap-2">
                <div className="flex gap-4 items-start">
                  <ScoreBadge shop={s} />
                  <div className="min-w-0 flex flex-col gap-1">
                    <Link href={`/webshop/${s.slug}`} className="font-semibold underline">
                      {i + 1}. {s.name}
                    </Link>
                    <span className="text-sm text-muted-foreground break-words">{s.domain}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{facts.join(" · ")}</p>
                <Suspense fallback={null}>
                  <Evidence shop={s} />
                </Suspense>
              </li>
            );
          })}
        </ol>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Zo maken we deze lijst</h2>
        {rankingExplanation().map((line) => (
          <p key={line} className="text-sm">
            {line}
          </p>
        ))}
        <p className="text-sm">
          Op de lijst staan alleen webshops met een definitieve score; shops die nog in beoordeling zijn, staan in de{" "}
          <Link href={`/categorie/${category.slug}`} className="underline">
            categorie {category.name_nl}
          </Link>
          .
        </p>
      </section>
      <FaqSection faqs={topic.faq} />
      <nav aria-label="Meer lijsten" className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Meer lijsten</h2>
        {siblings.map((t) => (
          <Link key={t.slug} href={`/beste/webshops-${t.slug}`} className="inline-flex min-h-11 items-center underline">
            {t.title}
          </Link>
        ))}
        <Link href={`/categorie/${category.slug}`} className="inline-flex min-h-11 items-center underline">
          Alle webshops in {category.name_nl}
        </Link>
      </nav>
      <NewsletterForm headline={signupHeadline()} source={`/beste/${slug}`} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: topic.title,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: list.length,
          itemListElement: list.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/webshop/${s.slug}`, name: s.name })),
        }}
      />
    </article>
  );
}

export default function BestePage(props: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <Suspense fallback={<PageLoading />}>
          <List {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
