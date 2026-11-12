import { createClient } from "@supabase/supabase-js";

// Slugs of shops with a public page (shops_public), so proxy.ts can answer a real 404 for any
// other /webshop/<slug>. The page itself cannot: with cacheComponents its notFound() runs inside
// a streamed Suspense boundary after the 200 status is sent (a "soft 404").
// One small query per server instance every 5 minutes. An unknown slug reloads the list at most
// once a minute, so a shop published tonight is never shown as 404 for more than a minute.
// Fails open: no settings or a failed query means "let the page decide", never a blocked page.
const TTL_MS = 5 * 60_000;
const RELOAD_UNKNOWN_MS = 60_000;
const PAGE = 1000;

type Loader = () => Promise<Set<string> | null>;
let cache: { at: number; slugs: Set<string> | null } | null = null;
let pending: Promise<Set<string> | null> | null = null;
let loader: Loader = loadFromDb;

/** True only when the list loaded and the slug is not on it. */
export async function isUnlistedShop(slug: string, now = Date.now()): Promise<boolean> {
  let slugs = await listed(now, TTL_MS);
  if (slugs && !slugs.has(slug)) slugs = await listed(now, RELOAD_UNKNOWN_MS);
  return slugs !== null && !slugs.has(slug);
}

async function listed(now: number, maxAge: number): Promise<Set<string> | null> {
  if (cache && now - cache.at < maxAge) return cache.slugs;
  pending ??= loader()
    .catch((err) => {
      console.error("listed slugs failed", err);
      return null;
    })
    .then((slugs) => {
      cache = { at: now, slugs };
      return slugs;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

async function loadFromDb(): Promise<Set<string> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const slugs = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("shops_public").select("slug").order("slug").range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const r of data) slugs.add(r.slug as string);
    if (data.length < PAGE) break;
  }
  return slugs;
}

/** Tests only. */
export function __setLoaderForTests(l: Loader | null) {
  loader = l ?? loadFromDb;
  cache = null;
  pending = null;
}
