import "server-only";
// Earned sub-scores and their verified quotes for one published shop. `scores` and
// `shop_signals` are internal tables, so this reads with the service client (like /go/)
// and returns only what earnedSubScores() lets through.
import { cacheLife, cacheTag } from "next/cache";
import { MAX_POINTS } from "@/lib/scoring/weights";
import { createServiceClient } from "@/lib/supabase/service";
import { earnedSubScores, type EarnedSubScore, type SignalRow } from "./evidence-rules";

export async function getEarnedSubScores(shopId: string): Promise<EarnedSubScore[]> {
  "use cache";
  cacheTag("shops");
  cacheLife("hours");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return []; // no key yet: show no sub-scores rather than unproven ones
  const db = createServiceClient();
  const { data: shop } = await db.from("shops_public").select("id").eq("id", shopId).maybeSingle();
  if (!shop) return [];
  const { data: score, error } = await db
    .from("scores")
    .select("sub_scores, run_id")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`scores: ${error.message}`);
  if (!score) return [];
  let signals: SignalRow[] = [];
  if (score.run_id) {
    const res = await db
      .from("shop_signals")
      .select("signal_key, value_bool, evidence_quote, evidence_url, quote_verified")
      .eq("shop_id", shopId)
      .eq("run_id", score.run_id)
      .eq("source", "llm")
      .eq("quote_verified", true);
    if (res.error) throw new Error(`shop_signals: ${res.error.message}`);
    signals = res.data as SignalRow[];
  }
  return earnedSubScores(score.sub_scores as Record<string, unknown>, MAX_POINTS, signals);
}
