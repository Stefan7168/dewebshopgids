import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewsletterForm } from "@/components/newsletter-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getGuides } from "@/lib/guide/data";
import { signupHeadline } from "@/lib/newsletter/core";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "De wekelijkse webshopgids",
  description: "Elke week een paar unieke Nederlandse woonwinkels, met hun echtheidsscore, keurmerk en hoe lang ze online zijn.",
  alternates: { canonical: `${SITE.url}/gids` },
};

async function GuideList() {
  const guides = await getGuides();
  if (!guides.length) return <p>De eerste gids verschijnt binnenkort. Schrijf je hieronder in, dan krijg je hem als eerste.</p>;
  return (
    <ul className="flex flex-col divide-y border rounded-md">
      {guides.map((g) => (
        <li key={g.id} className="p-4 flex flex-col gap-1">
          <Link href={`/gids/${g.slug}`} className="font-semibold underline">{g.title_nl ?? `Week ${g.iso_week}`}</Link>
          <span className="text-sm text-muted-foreground">Week {g.iso_week}, {g.iso_year}</span>
          {g.intro_nl ? <p className="text-sm">{g.intro_nl}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export default function GidsIndex() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">De wekelijkse webshopgids</h1>
        <p>
          Elke donderdag een paar webshops uit de gids: nieuw opgenomen, gestegen in echtheidsscore of veel bekeken. Alle cijfers komen uit
          onze eigen controle; niemand betaalt voor een plek.
        </p>
        <Suspense fallback={<p className="text-muted-foreground">Laden...</p>}>
          <GuideList />
        </Suspense>
        <NewsletterForm headline={signupHeadline()} source="/gids" />
      </main>
      <SiteFooter />
    </div>
  );
}
