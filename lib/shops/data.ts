"use cache";
// Public reads for the shop, category and home pages. Anon key without cookies, so
// RLS limits every read to `shops_public` and `categories`, and results can be cached.
// /api/revalidate expires the "shops" tag after the publish job; hourly as a fallback.
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
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

/** All published shops. At launch size (150) one read is cheaper than per-page queries. */
export async function getPublishedShops(): Promise<PublicShop[]> {
  cacheTag("shops");
  cacheLife("hours");
  const db = anon();
  if (!db) return [];
  const { data, error } = await db.from("shops_public").select(SHOP_COLS).limit(5000);
  if (error) throw new Error(`shops_public: ${error.message}`);
  return data as PublicShop[];
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
