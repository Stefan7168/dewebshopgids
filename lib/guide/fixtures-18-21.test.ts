import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkDraft } from "./check";

describe("gids issues 18 to 21 reference drafts", () => {
  it("pass checkDraft", async () => {
    for (const n of [18, 19, 20, 21]) {
      const m = await import(`./fixtures/issue-${n}`);
      expect(checkDraft(m[`issue${n}Draft`], m[`issue${n}Snapshot`])).toEqual([]);
    }
  });

  // Reads every fixture on disk, so it also covers issues added by other open PRs.
  it("repeat no shop from any other issue", async () => {
    const files = readdirSync(new URL("./fixtures", import.meta.url)).filter((f) => /^issue-\d+\.ts$/.test(f));
    const issues = await Promise.all(files.map((f) => import(`./fixtures/${f.replace(/\.ts$/, "")}`)));
    const slugs = issues.flatMap((m) => (Object.values(m).find((v) => (v as { shops?: unknown }).shops) as { shops: { slug: string }[] }).shops.map((s) => s.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
