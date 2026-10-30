import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/text-page";
import { badgePriceText, formatEur, UITGELICHT_EUR } from "@/lib/badge/pricing";
import { SITE, USER_AGENT_TOKEN } from "@/lib/site";

export const metadata: Metadata = {
  title: "Informatie voor webshops",
  description: "Waarom je webshop in De Webshopgids staat, welke gegevens we gebruiken en hoe je iets laat aanpassen of verwijderen.",
  alternates: { canonical: "/informatie-voor-webshops" },
};

export default function Page() {
  return (
    <TextPage title="Informatie voor webshops">
      <p>
        De Webshopgids is een onafhankelijke gids met Nederlandse webshops voor wonen. Opname is gratis en je hoeft er niets voor te doen.
        Hieronder staat wat we over je webshop tonen, waar het vandaan komt en wat je kunt doen als je het er niet mee eens bent. Kort
        antwoord op een vraag? Kijk bij de <Link href="/informatie-voor-webshops/vragen">vragen van webshops</Link>.
      </p>

      <h2>Wat we tonen</h2>
      <ul>
        <li>De echtheidsscore van 1 tot 100, met per onderdeel het citaat van je eigen site waarop de punten zijn gebaseerd.</li>
        <li>Hoe lang je site ongeveer online is, hoeveel producten je ongeveer hebt en of je een keurmerk hebt.</li>
        <li>Een korte beschrijving, prijsniveau, of je een fysieke winkel hebt en vanuit welk land je verzendt.</li>
      </ul>
      <p>
        Hoe de score werkt, lees je op <Link href="/hoe-wij-beoordelen">hoe wij beoordelen</Link>. Punten tonen we alleen als ze verdiend zijn.
      </p>

      <h2>Welke gegevens we gebruiken</h2>
      <ul>
        <li>Openbare pagina&apos;s van je eigen site. Onze bot heet {USER_AGENT_TOKEN}, vraagt hoogstens één pagina per 3 seconden en volgt robots.txt. Blokkeer je hem, dan lezen we je site niet meer.</li>
        <li>Openbare registers: het domeinregister, het webarchief en de ledenlijsten van keurmerken.</li>
        <li>Eén algemeen e-mailadres van je site, zoals info@ of contact@ op je eigen domein. Persoonlijke adressen (zoals voornaam@) slaan we niet op.</li>
      </ul>
      <p>
        We tonen geen namen of adressen van personen: in citaten vervangen we die door [naam] of [adres]. De tekst van je openbare pagina&apos;s
        bewaren we intern, zodat we de score later kunnen controleren; tekst die we 90 dagen niet opnieuw hebben gelezen, verwijderen we.
        We gebruiken deze gegevens op
        grond van ons gerechtvaardigd belang: kopers helpen unieke en betrouwbare webshops te vinden. Meer in de <Link href="/privacy">privacyverklaring</Link>.
      </p>

      <h2>Voordat je pagina online komt</h2>
      <p>
        Je krijgt 7 dagen voordat je pagina zichtbaar wordt een e-mail op dat algemene adres, met de gegevens die we gaan tonen. Hebben we geen
        algemeen adres van je gevonden, dan plaatsen we je webshop niet.
      </p>

      <h2>Iets laten aanpassen, verwijderen of bezwaar maken</h2>
      <ul>
        <li>Gebruik de link &quot;Klopt er iets niet?&quot; op je pagina, of ga naar <Link href="/herbeoordeling">herbeoordeling</Link>.</li>
        <li>Zodra je iets meldt, tonen we geen score meer maar &quot;In beoordeling&quot;. We antwoorden binnen 7 dagen.</li>
        <li>Vraag je om verwijdering of maak je bezwaar, dan sturen we een bevestigingslink naar een adres op je eigen domein. Zo kan niemand anders je pagina laten verwijderen. Na je klik halen we de pagina direct offline, en altijd binnen 48 uur.</li>
      </ul>

      <h2>Je beschrijving zelf aanpassen</h2>
      <p>
        Onder je pagina staat &ldquo;Is dit jouw webshop?&rdquo;. Daar vraag je een link aan, die we naar een adres op je eigen domein sturen. Met
        die link stuur je een nieuwe beschrijving in; na een korte controle staat hij online. Je score en je plaats veranderen daar niet door.
      </p>

      <h2>Geld</h2>
      <p>
        Wij verdienen aan affiliatecommissies: koopt iemand via onze link bij jou, dan kunnen wij een vergoeding krijgen. Daarnaast kun je
        betalen voor de <Link href="/geverifieerd">badge &ldquo;Geverifieerd&rdquo;</Link> op je pagina ({badgePriceText()}), of voor een
        plek in het blok &ldquo;Uitgelicht&rdquo; boven een categorie ({formatEur(UITGELICHT_EUR)} per maand). Dat blok heeft het label
        &ldquo;Advertentie&rdquo; en staat los van de lijst. Geen van deze betalingen verandert de score of de volgorde. Vragen? Mail <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </TextPage>
  );
}
