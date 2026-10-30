import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/site";

// Slugs of shops taken offline (removal or objection), so proxy.ts can answer 410 Gone.
// One small query per server instance every 5 minutes. The page content is gone at once
// (the shop page renders "niet gevonden" as soon as the tag is updated); only the status code can lag.
const TTL_MS = 5 * 60_000;
const RETRY_MS = 60_000;

let cache: { until: number; slugs: Set<string> } | null = null;
let pending: Promise<Set<string>> | null = null;

export async function removedSlugs(): Promise<Set<string>> {
  if (cache && Date.now() < cache.until) return cache.slugs;
  pending ??= load().finally(() => {
    pending = null;
  });
  return pending;
}

async function load(): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Set();
  try {
    // Service role: shops_public shows only live shops, so anon cannot tell removed from never listed.
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from("shops").select("slug").eq("status", "removed");
    if (error) throw new Error(error.message);
    cache = { until: Date.now() + TTL_MS, slugs: new Set(data.map((r) => r.slug as string)) };
  } catch (err) {
    console.error("removed slugs failed", err);
    // Keep the last list (or none) and try again in a minute; the page itself still says "niet gevonden".
    cache = { until: Date.now() + RETRY_MS, slugs: cache?.slugs ?? new Set() };
  }
  return cache.slugs;
}

/**
 * The 410 page itself. Plain HTML from the proxy, because Next.js pages cannot set status 410
 * (a rewrite keeps 200). Same footer identity as every other page.
 */
export function goneResponse(): Response {
  const identity = `${SITE.legalName ?? SITE.name}${SITE.kvk ? ` · KvK ${SITE.kvk}` : " · KvK-inschrijving in behandeling"}${SITE.address ? ` · ${SITE.address}` : ""}`;
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Webshop verwijderd | ${esc(SITE.name)}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;line-height:1.6;color:#111;background:#fff}main,footer{max-width:48rem;margin:0 auto;padding:2rem 1rem}h1{font-size:1.5rem;line-height:1.3}a{color:inherit}footer{border-top:1px solid #e5e5e5;font-size:.875rem;color:#555}@media (prefers-color-scheme:dark){body{color:#eee;background:#111}footer{border-color:#333;color:#aaa}}</style>
</head>
<body>
<main>
<p><a href="/">${esc(SITE.name)}</a></p>
<h1>Deze webshop staat niet meer in de gids</h1>
<p>De pagina over deze webshop is verwijderd en komt niet terug.</p>
<p>Zoek verder via de <a href="/">homepage</a>, bekijk alle <a href="/categorie/wonen">webshops voor wonen en interieur</a> of <a href="/zoeken">zoek een webshop</a>.</p>
</main>
<footer><p><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p><p>${esc(identity)}</p></footer>
</body>
</html>`;
  return new Response(html, { status: 410, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
