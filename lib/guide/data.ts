"use cache";
// Public reads for /gids. Anon key without cookies: RLS limits reads to published guides
// through guides_public. Cached under the "shops" tag, which /api/revalidate expires.
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

export type PublicGuide = {
  id: string; iso_year: number; iso_week: number; slug: string; title_nl: string | null; intro_nl: string | null;
  body_md: string | null; shop_ids: string[]; status: "published" | "sent" | "fallback"; published_at: string | null;
};
const COLS = "id, iso_year, iso_week, slug, title_nl, intro_nl, body_md, shop_ids, status, published_at";

function anon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Until migration 0012 is applied the view does not exist: show no guides instead of an error page. */
const missing = (e: { code?: string }) => e.code === "42P01" || e.code === "PGRST205";

export async function getGuides(): Promise<PublicGuide[]> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return [];
  const { data, error } = await db.from("guides_public").select(COLS).order("slug", { ascending: false }).limit(200);
  if (error) {
    if (missing(error)) return [];
    throw new Error(`guides_public: ${error.message}`);
  }
  return data as PublicGuide[];
}

export async function getGuide(slug: string): Promise<PublicGuide | null> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return null;
  const { data, error } = await db.from("guides_public").select(COLS).eq("slug", slug).maybeSingle();
  if (error) {
    if (missing(error)) return null;
    throw new Error(`guides_public: ${error.message}`);
  }
  return data as PublicGuide | null;
}
