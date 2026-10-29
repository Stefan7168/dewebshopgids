// FAQ blocks on /beste lists and category pages (traffic plan 2026-10-29). Each answer is shown on
// the page as well as in the FAQPage markup; the markup never holds text the reader cannot see.
export type Faq = { q: string; a: string };

export function faqJsonLd(faqs: readonly Faq[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export const wordCount = (paragraphs: readonly string[]) => paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
