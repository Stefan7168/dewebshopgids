import "server-only";
// When each listed shop's keurmerk was last confirmed: the newest certificate page that came back 200.
// The crawl only counts a keurmerk as verified when that page names the domain (crawl-shop.ts).
// `crawl_pages` is internal, so this reads with the service client and returns only dates.
import { cacheLife, cacheTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { newestCheckPerShop } from "./keurmerk-check";

export async function getKeurmerkCheckDates(shopIds: string[]): Promise<Map<string, string>> {
  "use cache";
  cacheTag("shops");
  cacheLife("hours");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || shopIds.length === 0) return new Map();
  const db = createServiceClient();
  const { data, error } = await db
    .from("crawl_pages")
    .select("shop_id, fetched_at")
    .in("shop_id", shopIds)
    .eq("page_type", "keurmerk_certificate")
    .eq("status_code", 200)
    .limit(5000);
  if (error) throw new Error(`crawl_pages: ${error.message}`);
  return newestCheckPerShop(data ?? []);
}
