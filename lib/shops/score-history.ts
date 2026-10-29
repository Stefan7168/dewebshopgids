import "server-only";
// Score history for one published shop. `scores` is an internal table, so this reads with the
// service client (like getEarnedSubScores) and returns only totals, versions and dates.
import { cacheLife, cacheTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { scoreChanges, type ScoreChange, type ScoreRow } from "./score-history-rules";

const HISTORY_DAYS = 400;

export async function getScoreChanges(shopId: string, currentScore: number): Promise<ScoreChange[]> {
  "use cache";
  cacheTag("shops");
  cacheLife("hours");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const db = createServiceClient();
  const { data: shop } = await db.from("shops_public").select("id").eq("id", shopId).maybeSingle();
  if (!shop) return [];
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
  const { data, error } = await db
    .from("scores")
    .select("total, score_version, created_at")
    .eq("shop_id", shopId)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) throw new Error(`scores: ${error.message}`);
  return scoreChanges((data ?? []) as ScoreRow[], currentScore);
}
