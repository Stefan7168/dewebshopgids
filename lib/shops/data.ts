"use cache";
// Public reads for the shop, category and home pages. Anon key without cookies, so
// RLS limits every read to `shops_public` and `categories`, and results can be cached.
// /api/revalidate expires the "shops" tag after the publish job; hourly as a fallback.
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { FeaturedPlacement } from "../featured/select";
import type { Category, PublicShop } from "./present";

const SHOP_COLS =
  "id, slug, name, domain, category_id, platform, product_count_est, domain_first_seen, keurmerk, keurmerk_status, affiliate_available, price_level, has_physical_store, store_city, ships_from_country, score, score_version, score_label, description_nl, verified_badge_until, updated_at, status";

function anon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null; // CI builds without Supabase env: render empty pages
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getCategories(): Promise<Category[]> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return [];
  const { data, error } = await db.from("categories").select("id, slug, name_nl, parent_id, intro_nl, seo_title, sort_order").order("sort_order");
  if (error) throw new Error(`categories: ${error.message}`);
  return data as Category[];
}

/** Supabase returns at most 1000 rows per request (PostgREST max_rows), so larger reads page. */
const PAGE = 1000;

/** All published shops. At launch size (150) one read is cheaper than per-page queries. */
export async function getPublishedShops(): Promise<PublicShop[]> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return [];
  const all: PublicShop[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("shops_public").select(SHOP_COLS).order("id").range(from, from + PAGE - 1);
    if (error) throw new Error(`shops_public: ${error.message}`);
    all.push(...(data as PublicShop[]));
    if (data.length < PAGE) return all;
  }
}

export async function getShop(slug: string): Promise<PublicShop | null> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return null;
  const { data, error } = await db.from("shops_public").select(SHOP_COLS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`shops_public: ${error.message}`);
  return data as PublicShop | null;
}

/** Live "Uitgelicht" placements. Empty until migration 0014 runs, so pages never fail on it. */
export async function getFeaturedPlacements(): Promise<FeaturedPlacement[]> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return [];
  const { data, error } = await db.from("featured_public").select("shop_id, active_until");
  if (error) return [];
  return data as FeaturedPlacement[];
}

/** Nightly popularity ranks (migration 0019). Empty if the table is missing, so pages never fail on it. */
export async function getPopularity(): Promise<{ shop_id: string; rank: number }[]> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return [];
  const { data, error } = await db.from("shop_popularity").select("shop_id, rank").order("rank");
  if (error) return [];
  return data as { shop_id: string; rank: number }[];
}

/** Today's date (YYYY-MM-DD), cached so prerendered pages can compare dates; badge grace covers the lag. */
export async function cachedToday(): Promise<string> {
  cacheLife("hours");
  return new Date().toISOString().slice(0, 10);
}
