import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { wordCount } from "../seo/faq";
import { CATEGORY_CONTENT } from "./content";

// Every category slug seeded by a migration.
const seeded = readdirSync("supabase/migrations")
  .filter((f) => f.includes("categor"))
  .flatMap((f) => [...readFileSync(`supabase/migrations/${f}`, "utf8").matchAll(/'([a-z-]+)', '[A-Z][^']*'/g)].map((m) => m[1]))
  .filter((s, i, all) => all.indexOf(s) === i);

describe("category page content", () => {
  it("covers every seeded category", () => {
    expect(seeded.length).toBeGreaterThanOrEqual(20);
    for (const slug of seeded) expect(CATEGORY_CONTENT[slug], slug).toBeDefined();
  });

  it("has a 120 to 200 word intro and 3 to 5 questions per category", () => {
    for (const [slug, c] of Object.entries(CATEGORY_CONTENT)) {
      const words = wordCount(c.intro);
      expect(words, `${slug}: ${words} words`).toBeGreaterThanOrEqual(120);
      expect(words, `${slug}: ${words} words`).toBeLessThanOrEqual(200);
      expect(c.faq.length, slug).toBeGreaterThanOrEqual(3);
      expect(c.faq.length, slug).toBeLessThanOrEqual(5);
      expect(c.keyword, slug).toBeTruthy();
    }
  });

  it("repeats no intro paragraph", () => {
    const all = Object.values(CATEGORY_CONTENT).flatMap((c) => c.intro);
    expect(new Set(all).size).toBe(all.length);
  });

  it("keeps the copy neutral", () => {
    for (const c of Object.values(CATEGORY_CONTENT)) {
      const text = [...c.intro, ...c.faq.flatMap((f) => [f.q, f.a])].join(" ");
      expect(text).not.toMatch(/onbetrouwbaar|review|advertentie|\b20\d\d\b/i);
    }
  });
});
