import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TextPage } from "@/components/text-page";
import { BADGE_MIN_SCORE, BADGE_PLANS, badgePriceText, checkoutConfig, formatEur, yearlySavingMonths } from "@/lib/badge/pricing";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Badge Geverifieerd voor webshops | De Webshopgids",
  description: `Laat kopers zien dat je webshop bij jou hoort. ${badgePriceText()}. De badge verandert niets aan je score of je plek in een lijst.`,
  alternates: { canonical: "/geverifieerd" },
};

type Search = Promise<{ betaald?: string; fout?: string; portaal?: string }>;

async function Notice({ searchParams }: { searchParams: Search }) {
  const { betaald, fout, portaal } = await searchParams;
  if (betaald) {
    return (
      <p role="status" className="rounded-md border p-4">
        Bedankt voor je betaling. Binnen een paar minuten staat de badge op je pagina. Je krijgt de bon van Stripe per e-mail.
      </p>
    );
  }
  if (fout) {
    return (
      <p role="status" className="rounded-md border p-4">
        Het betalen kon nu niet starten. Open de link uit je e-mail opnieuw, of mail <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    );
  }
  if (portaal) {
    return (
      <p role="status" className="rounded-md border p-4">
        Je abonnement kon nu niet openen. Open de link uit je e-mail opnieuw, of mail <a href={`mailto:${SITE.email}`}>{SITE.email}</a> om op te zeggen.
      </p>
    );
  }
  return null;
}

export default function Page(props: { searchParams: Search }) {
  const live = checkoutConfig() !== null;
  return (
    <TextPage title="Badge Geverifieerd">
      <Suspense>
        <Notice {...props} />
      </Suspense>
      <p>
        Met de badge Geverifieerd laat je kopers zien dat je webshop bij jou hoort en dat je achter je pagina in De Webshopgids staat. Je
        betaalt ervoor. Je score en je plek in de lijsten blijven precies hetzelfde.
      </p>

      <h2>Prijs</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {BADGE_PLANS.map((p) => (
          <div key={p.key} className="rounded-md border p-4 flex flex-col gap-1">
            <p className="text-2xl font-bold">
              {formatEur(p.eur)} <span className="text-base font-normal text-muted-foreground">{p.label}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {p.key === "year" ? `Je betaalt ${12 - yearlySavingMonths()} maanden en hebt de badge een jaar.` : "Elke maand opzegbaar."}
            </p>
          </div>
        ))}
      </div>
      {!live && (
        <p className="rounded-md border p-4">
          <strong>Binnenkort.</strong> Betalen kan nog niet. Wil je bericht als het kan? Mail{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> vanaf een adres op je eigen domein.
        </p>
      )}

      <h2>Wat je krijgt</h2>
      <ul>
        <li>Het label &ldquo;Geverifieerd&rdquo; op de pagina van je webshop, met de zin dat je voor de badge betaalt.</li>
        <li>Een badge voor je eigen site, die linkt naar je pagina in De Webshopgids.</li>
        <li>Elke maand een e-mail met het aantal keer dat lezers via ons naar je webshop klikten.</li>
      </ul>

      <h2>Wat de badge niet doet</h2>
      <ul>
        <li>Je score gaat er niet door omhoog. De score komt alleen uit wat op je eigen site staat.</li>
        <li>Je plek in een lijst verandert niet. Betaling heeft nooit invloed op de volgorde.</li>
        <li>Het is geen keurmerk en geen kopersbescherming. We controleren alleen dat de aanvrager bij de webshop hoort.</li>
      </ul>

      <h2>Wie de badge kan krijgen</h2>
      <p>
        Webshops die in De Webshopgids staan met een echtheidsscore van {BADGE_MIN_SCORE} of hoger. Een lagere score kun je niet afkopen. Klopt
        een gegeven niet, vraag dan een <Link href="/herbeoordeling">herbeoordeling</Link> aan; die is gratis.
      </p>

      <h2>Zo werkt het</h2>
      <ol className="list-decimal pl-5 flex flex-col gap-1">
        <li>Ga naar de pagina van je webshop en klik onderaan op &ldquo;Is dit jouw webshop?&rdquo;.</li>
        <li>Vul een e-mailadres op je eigen domein in. We sturen een link naar dat adres, of naar het algemene adres op je site.</li>
        <li>Open de link en kies {BADGE_PLANS.map((p) => `${formatEur(p.eur)} ${p.label}`).join(" of ")}. Je betaalt veilig via Stripe.</li>
        <li>Binnen een paar minuten staat de badge op je pagina. Opzeggen kan net zo makkelijk: via &ldquo;Abonnement beheren&rdquo; op dezelfde pagina, via de link in je Stripe-bon of door ons te mailen. De badge loopt tot het einde van de betaalde periode en gaat dan vanzelf uit. Bij een jaarbadge zie je de einddatum op die pagina.</li>
      </ol>

      <p className="text-sm text-muted-foreground">
        Meer over hoe we webshops opnemen: <Link href="/informatie-voor-webshops">informatie voor webshops</Link>. Vragen? Mail{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </TextPage>
  );
}
