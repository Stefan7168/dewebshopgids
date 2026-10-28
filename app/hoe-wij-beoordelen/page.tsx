import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/text-page";
import { rankingExplanation } from "@/lib/shops/present";
import { MIN_VALID_SIGNALS } from "@/lib/scoring/weights";

export const metadata: Metadata = {
  title: "Hoe wij beoordelen | De Webshopgids",
  description: "Hoe de echtheidsscore van 1 tot 100 wordt berekend, waar de gegevens vandaan komen en wat geen invloed heeft.",
  alternates: { canonical: "/hoe-wij-beoordelen" },
};

export default function Page() {
  return (
    <TextPage title="Hoe wij beoordelen">
      <p>
        Per webshop tonen we een echtheidsscore van 1 tot 100. Hoog betekent: een kleine, herkenbare shop die zelf maakt of een eigen merk
        verkoopt. Laag betekent: een grote winkel of marktplaats met van alles. De score zegt niets over de kwaliteit van producten of service.
      </p>

      <h2>Waar de gegevens vandaan komen</h2>
      <ul>
        <li>De openbare pagina&apos;s van de webshop zelf: de homepage, de pagina &quot;over ons&quot; en een paar productpagina&apos;s. Onze bot respecteert robots.txt.</li>
        <li>De sitemap van de webshop, voor het aantal producten.</li>
        <li>Openbare registers: het domeinregister en het webarchief voor de leeftijd van de site, en de ledenlijsten van keurmerken.</li>
      </ul>

      <h2>Hoe de score ontstaat</h2>
      <p>
        AI leest de teksten van de webshop en zoekt naar vaste kenmerken, steeds met een letterlijk citaat. Code controleert of elk citaat echt
        op de site staat. Een kenmerk zonder controleerbaar citaat telt niet mee. De score zelf berekent een vast rekenmodel, niet de AI.
        Met minder dan {MIN_VALID_SIGNALS} bruikbare kenmerken plaatsen we een webshop nog niet.
      </p>
      {/* The disclosure lines minus the first (list order) and the last (payment, covered below). */}
      {rankingExplanation().slice(1, -1).map((line) => (
        <p key={line}>{line}</p>
      ))}

      <h2>Tweede controle</h2>
      <p>
        Een tweede, aparte controle scoort nieuwe webshops opnieuw met een ander model en vergelijkt de uitkomst. Elke week controleert die
        ook een paar webshops die al in de gids staan. Bij een groot verschil kijkt een mens mee.
      </p>

      <h2>Wat geen invloed heeft</h2>
      <p>
        Betaling, een affiliatecommissie of een advertentie verandert de score en de volgorde niet. Opname is gratis.
      </p>

      <h2>Klopt er iets niet?</h2>
      <p>
        Gebruik de link &quot;Klopt er iets niet?&quot; op de pagina van de webshop. Zolang we kijken, tonen we geen score maar &quot;In
        beoordeling&quot;. We antwoorden binnen 7 dagen. Meer voor webshops: <Link href="/informatie-voor-webshops">informatie voor webshops</Link>.
      </p>
    </TextPage>
  );
}
