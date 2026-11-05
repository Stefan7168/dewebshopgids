import "server-only";
// The date we last read a published shop's site: the newest crawl page that came back 2xx. Every such
// crawl also re-checks the keurmerk (run-crawl.ts), so this is the "Laatst gecontroleerd" date.
// `crawl_pages` is internal, so this reads with the service client and returns only the date.
import { cacheLife, cacheTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function getLastChecked(shopId: string): Promise<string | null> {
  "use cache";
  cacheTag("shops");
  cacheLife("hours");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const db = createServiceClient();
  const { data: shop } = await db.from("shops_public").select("id").eq("id", shopId).maybeSingle();
  if (!shop) return null;
  const { data, error } = await db
    .from("crawl_pages")
    .select("fetched_at")
    .eq("shop_id", shopId)
    .gte("status_code", 200)
    .lte("status_code", 299)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`crawl_pages: ${error.message}`);
  return data ? (data.fetched_at as string).slice(0, 10) : null;
}
