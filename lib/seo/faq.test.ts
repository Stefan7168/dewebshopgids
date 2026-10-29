import { describe, expect, it } from "vitest";
import { faqJsonLd, wordCount } from "./faq";

describe("FAQ markup", () => {
  it("builds FAQPage with every visible question and answer", () => {
    const ld = faqJsonLd([{ q: "Vraag?", a: "Antwoord." }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toEqual([{ "@type": "Question", name: "Vraag?", acceptedAnswer: { "@type": "Answer", text: "Antwoord." } }]);
  });

  it("counts words across paragraphs", () => {
    expect(wordCount(["een twee", " drie  "])).toBe(3);
  });
});
