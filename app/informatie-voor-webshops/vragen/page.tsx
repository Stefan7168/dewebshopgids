import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { TextPage } from "@/components/text-page";
import { ownerFaqs } from "@/lib/owners/faq";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vragen van webshops",
  description: "Wat webshops ons vragen over opname, de echtheidsscore, je pagina aanpassen, de badge Geverifieerd en Uitgelicht.",
  alternates: { canonical: "/informatie-voor-webshops/vragen" },
};

export default function Page() {
  const faqs = ownerFaqs();
  return (
    <TextPage title="Vragen van webshops">
      <p>
        Staat je webshop in De Webshopgids? Hier vind je de vragen die we het vaakst krijgen. Meer achtergrond staat op{" "}
        <Link href="/informatie-voor-webshops">informatie voor webshops</Link> en <Link href="/hoe-wij-beoordelen">hoe wij beoordelen</Link>.
      </p>
      {faqs.map((f) => (
        <section key={f.q} className="flex flex-col gap-1">
          <h2>{f.q}</h2>
          <p>{f.a}</p>
        </section>
      ))}
      <p>
        Staat je vraag er niet bij? Mail <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </TextPage>
  );
}
