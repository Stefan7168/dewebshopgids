import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXCLUDED, launchCandidates, parseCsv } from "./launch-candidates";

const SLUGS = ["meubels", "verlichting", "woonaccessoires", "woontextiel", "slapen", "tuin-buiten", "keuken-tafelen"];
// Migration 0016: Tuin & buiten is top-level with these sub-categories.
const GARDEN = [
  "tuin-buiten",
  "tuinmeubels",
  "potten-plantenbakken",
  "buitenverlichting",
  "vuur-bbq",
  "tuinaccessoires",
];

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

describe("garden list", () => {
  const garden = launchCandidates(readFileSync(join(__dirname, "garden-candidates.csv"), "utf8"), [
    ...SLUGS,
    ...GARDEN,
  ]);
  const launch = launchCandidates(readFileSync(join(__dirname, "launch-candidates.csv"), "utf8"), SLUGS);

  it("queues the strong and medium garden shops only, in garden categories", () => {
    expect(garden).toHaveLength(39);
    for (const c of garden) {
      expect(GARDEN).toContain(c.category);
      expect(c.reason).toMatch(/^(strong|medium) fit; /);
    }
    expect(garden.map((c) => c.domain)).not.toContain("daankromhout.nl");
    expect(garden.find((c) => c.domain === "fluwel.nl")!.aliases).toEqual(["fluwel.com"]);
  });

  it("does not repeat a shop from the launch list", () => {
    const known = new Set(launch.flatMap((c) => [c.domain, ...c.aliases]));
    for (const c of garden) for (const d of [c.domain, ...c.aliases]) expect(known.has(d)).toBe(false);
  });
});

describe("home list 2", () => {
  const read = (f: string, slugs: string[]) => launchCandidates(readFileSync(join(__dirname, f), "utf8"), slugs);
  const home = read("home-candidates-2.csv", SLUGS);
  const known = new Set(
    [...read("launch-candidates.csv", SLUGS), ...read("garden-candidates.csv", [...SLUGS, ...GARDEN])].flatMap((c) => [
      c.domain,
      ...c.aliases,
    ]),
  );

  it("queues strong and medium Home & Living shops only, none in the garden", () => {
    expect(home.length).toBeGreaterThanOrEqual(30);
    for (const c of home) {
      expect(SLUGS.filter((s) => s !== "tuin-buiten")).toContain(c.category);
      expect(c.reason).toMatch(/^(strong|medium) fit; /);
    }
  });

  it("does not repeat a shop from the launch or garden list, or within itself", () => {
    const own = home.flatMap((c) => [c.domain, ...c.aliases]);
    expect(new Set(own).size).toBe(own.length);
    for (const d of own) expect(known.has(d)).toBe(false);
  });
});
