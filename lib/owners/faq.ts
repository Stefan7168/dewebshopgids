// Questions shop owners ask about being listed, the score, claiming and the paid options. Answers use
// the same numbers as the rest of the site (pricing.ts, the scoring constants), so they never drift.
// Voice rules: informal "je", never "review" or "onbetrouwbaar" (CLAUDE.md section 1).
import { BADGE_MIN_SCORE, badgePriceText, formatEur, UITGELICHT_EUR } from "@/lib/badge/pricing";

export type OwnerFaq = { q: string; a: string };

export function ownerFaqs(): OwnerFaq[] {
  return [
    {
      q: "Moet ik betalen om in De Webshopgids te staan?",
      a: "Nee. Opname is gratis en je hoeft er niets voor te doen. Wij kiezen zelf welke webshops we opnemen.",
    },
    {
      q: "Kan ik een hogere score of een betere plek kopen?",
      a: "Nee. De score en de volgorde komen alleen uit onze controle van je site. De badge, een plek in Uitgelicht en affiliatecommissies veranderen daar niets aan.",
    },
    {
      q: "Hoe kan mijn score hoger worden?",
      a: "De score komt uit zinnen die op je eigen site staan. Staat er niet duidelijk wat je zelf maakt of ontwerpt, waar je dat doet (bijvoorbeeld een eigen atelier of gemaakt in Nederland), je KvK-nummer en je adres, dan kunnen we daar geen punten voor geven. Link je keurmerklogo naar je certificaatpagina bij de keurmerkorganisatie, dan kunnen we het controleren. We lezen je site ongeveer elke maand opnieuw.",
    },
    {
      q: "Hoe pas ik de beschrijving van mijn webshop aan?",
      a: "Onder je pagina staat 'Is dit jouw webshop?'. Daar vraag je een link aan, die we naar een adres op je eigen domein sturen. Met die link stuur je een nieuwe beschrijving in. Na een korte controle staat hij online.",
    },
    {
      q: "Wat kost de badge Geverifieerd en wie kan hem krijgen?",
      a: `De badge kost ${badgePriceText()}. Hij is er voor webshops met een echtheidsscore van ${BADGE_MIN_SCORE} of hoger. We controleren je bedrijfsgegevens en je mag de badge op je eigen site tonen. Opzeggen kan elke maand. De badge verandert je score en je plek niet.`,
    },
    {
      q: "Wat is Uitgelicht?",
      a: `Een betaalde plek in een apart blok boven een categorie, voor ${formatEur(UITGELICHT_EUR)} per maand. Het blok heeft altijd het label 'Advertentie' en staat los van de lijst op score.`,
    },
    {
      q: "Er klopt iets niet, of ik wil niet in de gids staan. Wat nu?",
      a: "Gebruik 'Klopt er iets niet?' op je pagina of ga naar de pagina herbeoordeling. Zolang we kijken, tonen we 'In beoordeling' in plaats van een score. We antwoorden binnen 7 dagen. Vraag je om verwijdering, dan halen we je pagina na je bevestiging binnen 48 uur offline.",
    },
    {
      q: "Krijg ik e-mail van jullie?",
      a: "Je krijgt 7 dagen voordat je pagina online komt één e-mail op het algemene adres van je site, met de gegevens die we gaan tonen. Hebben we geen algemeen adres van je gevonden, dan plaatsen we je webshop niet.",
    },
  ];
}
