import { JsonLd } from "@/components/json-ld";
import { faqJsonLd, type Faq } from "@/lib/seo/faq";

export function FaqSection({ faqs }: { faqs: readonly Faq[] }) {
  if (faqs.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" aria-labelledby="faq-titel">
      <h2 id="faq-titel" className="text-xl font-semibold">
        Veelgestelde vragen
      </h2>
      {faqs.map((f) => (
        <details key={f.q} className="rounded-lg border px-4">
          <summary className="min-h-11 py-3 cursor-pointer font-medium">{f.q}</summary>
          <p className="pb-3 text-sm">{f.a}</p>
        </details>
      ))}
      <JsonLd data={faqJsonLd(faqs)} />
    </section>
  );
}
