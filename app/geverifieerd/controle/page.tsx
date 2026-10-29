import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/text-page";
import { BADGE_MIN_SCORE } from "@/lib/badge/pricing";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Wat we controleren voor de badge Geverifieerd | De Webshopgids",
  description: "De vaste lijst met controles voordat een webshop de badge Geverifieerd krijgt, en wat de badge niet zegt.",
  alternates: { canonical: "/geverifieerd/controle" },
};

// The fixed checklist behind the badge. Every item is enforced in code (claim link, lib/badge/eligibility.ts,
// the Stripe webhook); add a line here only when code checks it too.
export default function Page() {
  return (
    <TextPage title="Wat we controleren voor de badge">
      <p>
        De badge <Link href="/geverifieerd">Geverifieerd</Link> is een betaalde vermelding. Voordat hij op een pagina staat, controleren we deze
        punten. Ze gelden voor elke webshop op dezelfde manier.
      </p>

      <h2>Voordat de badge aangaat</h2>
      <ol className="list-decimal pl-5 flex flex-col gap-1">
        <li>
          <strong>De aanvrager hoort bij de webshop.</strong> De betaallink staat alleen achter een link die we mailen naar een adres op het
          eigen domein van de webshop, of naar het algemene adres dat op de site staat.
        </li>
        <li>
          <strong>De webshop staat in de gids.</strong> De pagina is gepubliceerd na onze vaste beoordeling, met een vooraankondiging aan de
          webshop.
        </li>
        <li>
          <strong>De echtheidsscore is {BADGE_MIN_SCORE} of hoger.</strong> De score komt uit wat letterlijk op de eigen site staat, zie{" "}
          <Link href="/hoe-wij-beoordelen">hoe wij beoordelen</Link>.
        </li>
        <li>
          <strong>De betaling is gelukt.</strong> Stripe bevestigt de betaling aan ons. Pas dan staat de badge aan.
        </li>
      </ol>

      <h2>Zolang de badge aan staat</h2>
      <ul>
        <li>Stopt de betaling, dan gaat de badge uit na het einde van de betaalde periode.</li>
        <li>Wordt de webshop verwijderd of loopt er een herbeoordeling, dan toont de pagina geen score; de badge verandert daar niets aan.</li>
      </ul>

      <h2>Wat de badge niet zegt</h2>
      <ul>
        <li>Het is geen keurmerk en geen kopersbescherming. We controleren geen levering, retouren of klantenservice.</li>
        <li>We controleren niet de inschrijving bij de KvK of andere bedrijfsgegevens.</li>
        <li>De badge verandert de score en de volgorde in lijsten niet.</li>
      </ul>

      <p className="text-sm text-muted-foreground">
        Klopt er iets niet aan een webshop met de badge? Vraag een <Link href="/herbeoordeling">herbeoordeling</Link> aan of mail{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </TextPage>
  );
}
