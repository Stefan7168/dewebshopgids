// Go-live checks from build/go-live-checklist.md (steps 4 to 7 and the day-before rows 6 to 8), run
// in one command once Basic Auth is off: `npx tsx scripts/setup/go-live-check.ts [https://dewebshopgids.nl]`.
// Read-only GET and HEAD requests without a password; exits 1 when any check fails. Also safe to run
// before go-live: then the public-page checks fail (401), which is the expected "not live yet".
import { SITE } from "@/lib/site";

export type Probe = { status: number; location: string | null; body: string };
export type Fetcher = (url: string) => Promise<Probe>;
export type Check = { name: string; ok: boolean; detail: string };

const ROBOTS_DISALLOW = ["/go/", "/admin/", "/api/", "/auth/", "/herbeoordeling", "/zoeken"];

export function checkPublicPage(path: string, p: Probe): Check {
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(p.body);
  return { name: `${path} is open and indexable`, ok: p.status === 200 && !noindex, detail: noindex ? "noindex on the page" : `HTTP ${p.status}` };
}

export function checkRobots(base: string, p: Probe): Check {
  const missing = ROBOTS_DISALLOW.filter((d) => !p.body.includes(`Disallow: ${d}`));
  const sitemap = p.body.includes(`Sitemap: ${base}/sitemap.xml`);
  const ok = p.status === 200 && /Allow: \/\s/.test(p.body) && !missing.length && sitemap;
  return { name: "robots.txt", ok, detail: ok ? "allow /, disallows and sitemap present" : `HTTP ${p.status}; missing ${[...missing, ...(sitemap ? [] : ["Sitemap"])].join(", ") || "Allow: /"}` };
}

/** All <loc> URLs in a sitemap. */
export function sitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

export function checkSitemap(base: string, p: Probe): Check {
  const urls = sitemapUrls(p.body);
  const foreign = urls.filter((u) => !u.startsWith(`${base}/`) && u !== base);
  const ok = p.status === 200 && urls.length > 0 && !foreign.length;
  return { name: "sitemap.xml", ok, detail: foreign.length ? `${foreign.length} URLs not on ${base}, e.g. ${foreign[0]}` : `HTTP ${p.status}, ${urls.length} URLs` };
}

export function checkAdminClosed(p: Probe): Check {
  return { name: "/admin needs a login", ok: p.status !== 200 && p.status !== 0, detail: `HTTP ${p.status}${p.location ? ` to ${p.location}` : ""}` };
}

export function checkWwwRedirect(base: string, p: Probe): Check {
  const ok = [301, 308].includes(p.status) && (p.location ?? "").replace(/\/$/, "") === base;
  return { name: "www redirects to the apex", ok, detail: `HTTP ${p.status}${p.location ? ` to ${p.location}` : ""}` };
}

export function checkVercelCopyClosed(p: Probe): Check {
  // Deployment Protection answers 401 or redirects to vercel.com/sso; a 200 is a second open copy of the site.
  return { name: "*.vercel.app copy is not open", ok: p.status !== 200 && p.status !== 0, detail: p.status ? `HTTP ${p.status}` : "unreachable" };
}

export async function runChecks(base: string, fetcher: Fetcher, samplePages: string[]): Promise<Check[]> {
  const host = new URL(base).host;
  const get = (path: string) => fetcher(`${base}${path}`);
  const checks: Check[] = [];
  for (const path of ["/", ...samplePages, "/llms.txt"]) checks.push(checkPublicPage(path, await get(path)));
  checks.push(checkRobots(base, await get("/robots.txt")));
  const sm = await get("/sitemap.xml");
  checks.push(checkSitemap(base, sm));
  // Up to 10 sitemap URLs, spread over the list, must answer 200.
  const urls = sitemapUrls(sm.body);
  const step = Math.max(1, Math.floor(urls.length / 10));
  for (const u of urls.filter((_, i) => i % step === 0).slice(0, 10)) {
    const p = await fetcher(u);
    checks.push({ name: `sitemap URL ${new URL(u).pathname}`, ok: p.status === 200, detail: `HTTP ${p.status}` });
  }
  checks.push(checkAdminClosed(await get("/admin")));
  checks.push(checkWwwRedirect(base, await fetcher(`https://www.${host}/`)));
  checks.push(checkVercelCopyClosed(await fetcher("https://dewebshopgids.vercel.app/")));
  return checks;
}

/** A DNS or network error counts as status 0, so one unreachable host fails its check instead of the run. */
const nodeFetcher: Fetcher = async (url) => {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "dewebshopgids-go-live-check" } });
    const type = res.headers.get("content-type") ?? "";
    return { status: res.status, location: res.headers.get("location"), body: /text|xml|json/.test(type) ? await res.text() : "" };
  } catch (err) {
    return { status: 0, location: null, body: String((err as Error).cause ?? err) };
  }
};

async function main() {
  const base = (process.argv[2] ?? SITE.url).replace(/\/$/, "");
  const samples = (process.argv[3] ?? "").split(",").filter(Boolean);
  const checks = await runChecks(base, nodeFetcher, samples);
  for (const c of checks) console.log(`${c.ok ? "ok  " : "FAIL"}  ${c.name}  (${c.detail})`);
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} of ${checks.length} checks failed.` : `\nAll ${checks.length} checks passed.`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1]?.endsWith("go-live-check.ts")) void main();
