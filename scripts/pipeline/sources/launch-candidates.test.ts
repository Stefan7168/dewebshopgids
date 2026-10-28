import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXCLUDED, launchCandidates, parseCsv } from "./launch-candidates";

const SLUGS = ["meubels", "verlichting", "woonaccessoires", "woontextiel", "slapen", "tuin-buiten", "keuken-tafelen"];

describe("parseCsv", () => {
  it("handles quotes, doubled quotes and commas inside fields", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n\n')).toEqual([{ a: "x, y", b: 'say "hi"' }]);
  });
});

describe("launchCandidates", () => {
  const csv = readFileSync(join(__dirname, "launch-candidates.csv"), "utf8");
  const list = launchCandidates(csv, SLUGS);

  it("queues only strong and medium fits, once per domain, without the excluded shops", () => {
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(178);
    const fits = new Set(rows.filter((r) => list.some((c) => c.domain === r.domain)).map((r) => r.fit));
    expect([...fits].sort()).toEqual(["medium", "strong"]);
    for (const d of EXCLUDED) expect(list.map((c) => c.domain)).not.toContain(d);
    expect(new Set(list.map((c) => c.domain)).size).toBe(list.length);
    expect(list.length).toBe(110);
  });

  it("keeps the redirect source as an alias and writes a short reason", () => {
    const f = list.find((c) => c.domain === "functionals.com")!;
    expect(f.aliases).toEqual(["functionals.eu"]);
    expect(f.category).toBe("meubels");
    expect(f.reason.startsWith("strong fit; own brand, own factory")).toBe(true);
    for (const c of list) expect(c.reason.length).toBeLessThanOrEqual(500);
  });

  it("skips rows whose category is unknown", () => {
    expect(launchCandidates(csv, ["meubels"]).every((c) => c.category === "meubels")).toBe(true);
  });
});
