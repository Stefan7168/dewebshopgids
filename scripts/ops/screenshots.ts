// Weekly phone check by code (plan v4 section 5, phase 2): Sunday before the digest, open the home page
// plus 4 random sitemap pages at 390 px, save screenshots as a workflow artifact, and write one
// health_checks row ("screenshots") that the digest reports. Fails a page on a non-200 answer or
// sideways scroll. While the site is behind Basic Auth it needs BASIC_AUTH_USER and BASIC_AUTH_PASSWORD, else it reports "warn".
import { mkdirSync } from "node:fs";
import { connect, runAgentJob } from "../../agents/shared/audit";

export const WIDTH = 390;
export const RANDOM_PAGES = 4;

export type PageResult = { url: string; status: number | null; scrollWidth: number | null; file: string | null };
export type ScreenshotCheck = { status: "ok" | "warn" | "fail"; detail: { pages: PageResult[]; problems: string[] } };

/** Page URLs from a sitemap, minus the home page, `n` picked with `rand` (injectable for tests). */
export function pickUrls(sitemapXml: string, base: string, n: number, rand: () => number = Math.random): string[] {
  const home = base.replace(/\/$/, "");
  const all = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => u.startsWith(home) && u.replace(/\/$/, "") !== home);
  const pool = [...new Set(all)];
  const out: string[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return [`${home}/`, ...out];
}

export function judge(pages: PageResult[], privateSite: boolean): ScreenshotCheck {
  if (privateSite) return { status: "warn", detail: { pages, problems: ["site is private (401) and BASIC_AUTH_USER/BASIC_AUTH_PASSWORD are not set"] } };
  const problems = pages.flatMap((p) => [
    ...(p.status !== 200 ? [`${p.url}: status ${p.status ?? "none"}`] : []),
    ...(p.scrollWidth !== null && p.scrollWidth > WIDTH ? [`${p.url}: ${p.scrollWidth}px wide, scrolls sideways at ${WIDTH}px`] : []),
  ]);
  return { status: problems.length ? "fail" : "ok", detail: { pages, problems } };
}

type Page = {
  goto(url: string, o: { waitUntil: "networkidle"; timeout: number }): Promise<{ status(): number } | null>;
  evaluate<T>(fn: () => T): Promise<T>;
  screenshot(o: { path: string; fullPage: boolean }): Promise<unknown>;
  close(): Promise<void>;
};
type Context = {
  request: { get(url: string): Promise<{ status(): number; ok(): boolean; text(): Promise<string> }> };
  newPage(): Promise<Page>;
};
type Chromium = {
  launch(): Promise<{ newContext(o: Record<string, unknown>): Promise<Context>; close(): Promise<void> }>;
};

async function capture(base: string, outDir: string): Promise<ScreenshotCheck> {
  // `playwright` is installed only in the screenshots workflow (not a project dependency), so the import
  // name is a variable and the few calls used here are typed by hand.
  const name = "playwright";
  const { chromium } = (await import(name)) as { chromium: Chromium };
  const username = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: 844 },
      ...(username && password ? { httpCredentials: { username, password } } : {}),
    });
    const sitemap = await context.request.get(`${base.replace(/\/$/, "")}/sitemap.xml`);
    if (sitemap.status() === 401) return judge([], true);
    const urls = pickUrls(sitemap.ok() ? await sitemap.text() : "", base, RANDOM_PAGES);
    mkdirSync(outDir, { recursive: true });
    const pages: PageResult[] = [];
    for (const [i, url] of urls.entries()) {
      const page = await context.newPage();
      const res = await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => null);
      const file = `${outDir}/${i + 1}.png`;
      const scrollWidth = res ? await page.evaluate(() => document.documentElement.scrollWidth) : null;
      if (res) await page.screenshot({ path: file, fullPage: true });
      pages.push({ url, status: res?.status() ?? null, scrollWidth, file: res ? file : null });
      await page.close();
    }
    return judge(pages, false);
  } finally {
    await browser.close();
  }
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "screenshots", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await capture(process.env.SITE_URL ?? "https://dewebshopgids.nl", "screenshots");
      await sql`insert into public.health_checks ("check", status, detail) values ('screenshots', ${r.status}, ${sql.json(r.detail as never)})`;
      const summary = `screenshots ${r.status}: ${r.detail.pages.length} page(s)${r.detail.problems.length ? `; ${r.detail.problems.join("; ")}` : ""}`;
      console.log(summary);
      return { summary };
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("screenshots.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
