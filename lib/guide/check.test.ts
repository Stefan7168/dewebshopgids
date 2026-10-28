import { describe, expect, it } from "vitest";
import { checkDraft } from "./check";
import { fallbackIssue } from "./fallback";
import type { GuideSnapshot } from "./inputs";
import { guideHtml, parseGuideMarkdown } from "./markdown";

const snapshot: GuideSnapshot = {
  slug: "2026-week-45",
  window: { start: "2026-10-25T23:00:00.000Z", end: "2026-11-01T23:00:00.000Z" },
  shops: [{
    id: "s1", slug: "studio-hout", name: "Studio Hout", category: "Meubels", score: 82, score_label: null,
    keurmerk: "Geen keurmerk gevonden", online_since: "2014", products: "Ongeveer 120 producten", city: "Utrecht",
    description: null, clicks: 40, reason: "nieuw", score_change: null,
  }],
};
const good = {
  title_nl: "Vijf makers voor week 45",
  intro_nl: "Deze week een meubelmaker uit Utrecht.",
  body_md: "## [Studio Hout](/webshop/studio-hout)\n\nOnline sinds 2014, echtheidsscore 82 van 100, ongeveer 120 producten.",
  shop_ids: ["s1"],
};

describe("checkDraft", () => {
  it("passes a draft that uses only the inputs", () => {
    expect(checkDraft(good, snapshot)).toEqual([]);
  });

  it("flags invented numbers, outside links, banned words and unknown shops", () => {
    const f = checkDraft({
      ...good,
      body_md: good.body_md + "\n\nAl 25 jaar actief. Lees de review op [hun site](https://studiohout.nl) of [elders](/webshop/andere-shop).",
      shop_ids: ["s1", "s9"],
    }, snapshot);
    expect(f).toEqual(expect.arrayContaining([
      "number 25 is not in the inputs",
      "outside links are not allowed",
      "banned word: \\breview",
      "link /webshop/andere-shop is not one of this week's shops",
      "shop s9 is not in this week's inputs",
    ]));
  });

  it("accepts the code fallback", () => {
    expect(checkDraft(fallbackIssue(snapshot), snapshot)).toEqual([]);
  });
});

describe("guide markdown", () => {
  it("keeps own links, drops outside links and escapes HTML", () => {
    const html = guideHtml(parseGuideMarkdown("## Kop\n\n**Vet** <b>x</b> [shop](/webshop/a-b) [weg](https://x.nl)"), "https://dewebshopgids.nl");
    expect(html).toBe('<h2>Kop</h2>\n<p><strong>Vet</strong> &lt;b&gt;x&lt;/b&gt; <a href="https://dewebshopgids.nl/webshop/a-b">shop</a> weg</p>');
  });
});

describe("gids issue 1 reference draft", () => {
  it("passes the code checks", async () => {
    const { issue1Draft, issue1Snapshot } = await import("./fixtures/issue-1");
    expect(checkDraft(issue1Draft, issue1Snapshot)).toEqual([]);
  });

  it("would be rejected with the outline's founding year and collection count, which are not inputs", async () => {
    const { issue1Draft, issue1Snapshot } = await import("./fixtures/issue-1");
    const body = issue1Draft.body_md!.replace("in Drenthe.", "in Drenthe. Op de eigen site staat het jaartal 1610.").replace("eigen atelier.", "eigen atelier, in 29 collecties.");
    expect(checkDraft({ ...issue1Draft, body_md: body }, issue1Snapshot)).toEqual(["number 1610 is not in the inputs", "number 29 is not in the inputs"]);
  });
});

describe("gids issue 2 reference draft", () => {
  it("passes the code checks", async () => {
    const { issue2Draft, issue2Snapshot } = await import("./fixtures/issue-2");
    expect(checkDraft(issue2Draft, issue2Snapshot)).toEqual([]);
  });

  it("links back to the gids overview, not to an outside page", async () => {
    const { issue2Draft } = await import("./fixtures/issue-2");
    expect(issue2Draft.body_md).toContain("](/gids)");
  });
});

describe("gids issues 3 and 4 reference drafts", () => {
  it("pass the code checks", async () => {
    const { issue3Draft, issue3Snapshot } = await import("./fixtures/issue-3");
    const { issue4Draft, issue4Snapshot } = await import("./fixtures/issue-4");
    expect(checkDraft(issue3Draft, issue3Snapshot)).toEqual([]);
    expect(checkDraft(issue4Draft, issue4Snapshot)).toEqual([]);
  });

  it("repeat no shop from an earlier issue", async () => {
    const issues = await Promise.all([1, 2, 3, 4].map((n) => import(`./fixtures/issue-${n}`)));
    const slugs = issues.flatMap((m) => (Object.values(m).find((v) => (v as { shops?: unknown }).shops) as { shops: { slug: string }[] }).shops.map((s) => s.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
