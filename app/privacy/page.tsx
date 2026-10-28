import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/text-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacyverklaring | De Webshopgids",
  description: "Welke gegevens De Webshopgids verwerkt, waarom, en welke rechten je hebt.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <TextPage title="Privacyverklaring">
      <p>
        {SITE.legalName ?? SITE.name} is verantwoordelijk voor de gegevens op deze site. Contact: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        {SITE.kvk ? ` KvK ${SITE.kvk}.` : ""}
      </p>

      <h2>Bezoekers</h2>
      <ul>
        <li>We gebruiken geen cookies voor statistiek of advertenties. Voor bezoekcijfers gebruiken we Vercel Web Analytics, dat geen cookies plaatst. Codes in links, zoals die in een bevestigingslink, sturen we niet mee.</li>
        <li>Klik je via ons door naar een webshop, dan bewaren we de webshop, het tijdstip, de pagina waar je vandaan kwam, het soort apparaat en het land. Geen IP-adres.</li>
      </ul>

      <h2>Nieuwsbrief</h2>
      <ul>
        <li>Je e-mailadres staat bij onze verzendpartij Resend. Je bent pas aangemeld als je de bevestigingslink klikt (toestemming).</li>
        <li>Afmelden kan met de link in elke e-mail. Daarna sturen we je niets meer. Wil je dat we je adres ook helemaal verwijderen, mail ons dan.</li>
      </ul>

      <h2>Meldingen over een webshop</h2>
      <p>
        Via <Link href="/herbeoordeling">herbeoordeling</Link> bewaren we je e-mailadres en je bericht, om je melding af te handelen en je
        antwoord te sturen. Je bericht wordt gelezen door ons en door een AI-assistent die ons helpt; die stuurt nooit zelf e-mail.
      </p>

      <h2>Webshops</h2>
      <p>
        Over webshops gebruiken we openbare gegevens van hun eigen site en uit openbare registers, en één algemeen e-mailadres zoals info@. Zie{" "}
        <Link href="/informatie-voor-webshops">informatie voor webshops</Link>.
      </p>

      <h2>Partijen die voor ons werken</h2>
      <ul>
        <li>Vercel: hosting van de site en bezoekcijfers.</li>
        <li>Supabase: de database, in Frankfurt.</li>
        <li>Resend: verzending van e-mail.</li>
        <li>Anthropic: AI die de teksten van webshops en meldingen leest.</li>
        <li>GitHub: de geplande taken die de gids bijwerken.</li>
      </ul>

      <h2>Je rechten</h2>
      <p>
        Je mag je gegevens inzien, laten verbeteren of laten verwijderen, en bezwaar maken. Mail ons via{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>; we antwoorden binnen een maand. Ben je het niet eens met hoe we met je gegevens omgaan,
        dan kun je een klacht indienen bij de <a href="https://www.autoriteitpersoonsgegevens.nl">Autoriteit Persoonsgegevens</a>.
      </p>
    </TextPage>
  );
}
