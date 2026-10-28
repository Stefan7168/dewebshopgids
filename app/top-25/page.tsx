import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsletterForm } from "@/components/newsletter-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LEAD_MAGNET_TITLE, leadMagnetShops, signupHeadline } from "@/lib/newsletter/core";
import { getPublishedShops } from "@/lib/shops/data";

// Landing page for the lead magnet (plan v3 section 11, Meta ad test 1). The list itself only
// arrives by email after double opt-in; the page promises it only once 25 shops have a score.
export const metadata: Metadata = {
  title: LEAD_MAGNET_TITLE,
  description: "Gratis lijst met de 25 woonwebshops met de hoogste echtheidsscore, gemaakt met onze eigen controle van elke shop.",
  robots: { index: false, follow: true },
};

async function Offer() {
  const ready = leadMagnetShops(await getPublishedShops()).length > 0;
  if (!ready) {
    return (
      <>
        <p>Deze lijst maken we zodra we genoeg webshops hebben beoordeeld. Schrijf je in, dan krijg je hem zodra hij klaar is.</p>
        <NewsletterForm headline={signupHeadline()} source="/top-25" />
      </>
    );
  }
  return (
    <>
      <p>
        We bekijken elke webshop zelf: hoeveel producten hij verkoopt, hoe lang hij online is, of het keurmerk echt is en of hij
        zelf maakt of ontwerpt. Daaruit volgt een echtheidsscore van 1 tot 100. De 25 hoogste scores zetten we voor je op een rij.
      </p>
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>Alleen Nederlandse woonwebshops, van meubels tot servies</li>
        <li>De volgorde komt alleen uit de score; betalen voor een plek kan niet</li>
        <li>Daarna elke week 5 unieke woonwinkels in je inbox, afmelden kan altijd</li>
      </ul>
      <NewsletterForm headline="Stuur mij de lijst" source="/top-25" />
    </>
  );
}

export default function LeadMagnetPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{LEAD_MAGNET_TITLE}</h1>
        <Suspense fallback={<p className="text-muted-foreground">Laden...</p>}>
          <Offer />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
