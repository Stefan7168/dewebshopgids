import { createClient } from "@supabase/supabase-js";

// Slugs that have a public page, so proxy.ts can answer a real 404 for any other
// /webshop/<slug>, /categorie/<slug> or /gids/<slug>. The pages cannot: with cacheComponents their
// notFound() runs inside a streamed Suspense boundary after the 200 status is sent (a "soft 404").
// One small query per kind per server instance every 5 minutes. An unknown slug reloads its list at
// most once a minute, so a shop or gids issue published tonight is never a 404 for more than a minute.
// Fails open: no settings or a failed query means "let the page decide", never a blocked page.
const TTL_MS = 5 * 60_000;
const RELOAD_UNKNOWN_MS = 60_000;
const PAGE = 1000;

export type ListedKind = "shop" | "category" | "guide";
const SOURCE: Record<ListedKind, string> = { shop: "shops_public", category: "categories", guide: "guides_public" };

type Loader = (kind: ListedKind) => Promise<Set<string> | null>;
const cache = new Map<ListedKind, { at: number; slugs: Set<string> | null }>();
const pending = new Map<ListedKind, Promise<Set<string> | null>>();
let loader: Loader = loadFromDb;

/** True only when the list loaded and the slug is not on it. */
export async function isUnlisted(kind: ListedKind, slug: string, now = Date.now()): Promise<boolean> {
  let slugs = await listed(kind, now, TTL_MS);
  if (slugs && !slugs.has(slug)) slugs = await listed(kind, now, RELOAD_UNKNOWN_MS);
  return slugs !== null && !slugs.has(slug);
}

async function listed(kind: ListedKind, now: number, maxAge: number): Promise<Set<string> | null> {
  const hit = cache.get(kind);
  if (hit && now - hit.at < maxAge) return hit.slugs;
  let p = pending.get(kind);
  if (!p) {
    p = loader(kind)
      .catch((err) => {
        console.error(`listed ${kind} slugs failed`, err);
        return null;
      })
      .then((slugs) => {
        cache.set(kind, { at: now, slugs });
        return slugs;
      })
      .finally(() => pending.delete(kind));
    pending.set(kind, p);
  }
  return p;
}

async function loadFromDb(kind: ListedKind): Promise<Set<string> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const slugs = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(SOURCE[kind]).select("slug").order("slug").range(from, from + PAGE - 1);
    if (error) throw new Error(`${SOURCE[kind]}: ${error.message}`);
    for (const r of data) slugs.add(r.slug as string);
    if (data.length < PAGE) break;
  }
  return slugs;
}

/** Tests only. */
export function __setLoaderForTests(l: Loader | null) {
  loader = l ?? loadFromDb;
  cache.clear();
  pending.clear();
}
