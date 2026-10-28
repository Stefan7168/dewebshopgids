// scoreBatch() and collectBatches() (plan v3 section 7, scoring step 3).
// Night N submits one Batch API job and stores its id in score_runs; every run
// first collects ended batches. No database access here, so it tests with a mock client.
import type Anthropic from "@anthropic-ai/sdk";
import { computeScore, type ScoreResult } from "../../../lib/scoring/compute";
import { matchRate, MIN_RUN_MATCH_RATE, type QuoteCheck } from "../../../lib/scoring/quotes";
import { parseAnswer, ParseError, type ParsedAnswer } from "./parse";
import { buildParams, type CrawlPage, type RuleFacts } from "./prompt";

/** Batch prices for claude-haiku-5-5: 50% of USD 0.10 / 0.50 per million tokens. */
export const BATCH_USD_PER_MTOK = { input: 0.05, output: 0.25 } as const;

export type BatchClient = { messages: { batches: Pick<Anthropic.Messages.Batches, "create" | "retrieve" | "results"> } };

export type ScoreItem = {
  shopId: string;
  shop: { name: string; domain: string };
  pages: CrawlPage[];
  facts: RuleFacts;
};

/** Submit one batch. custom_id is the shop id. */
export async function scoreBatch(client: BatchClient, items: ScoreItem[]): Promise<{ batchId: string; submitted: number }> {
  if (items.length === 0) throw new Error("nothing to submit");
  const batch = await client.messages.batches.create({
    requests: items.map((it) => ({ custom_id: it.shopId, params: buildParams(it.shop, it.pages, it.facts) })),
  });
  return { batchId: batch.id, submitted: items.length };
}

export type ShopOutcome =
  | { shopId: string; kind: "scored"; parsed: ParsedAnswer; score: ScoreResult }
  | { shopId: string; kind: "failed"; reason: string };

export type CollectResult =
  | { state: "pending"; status: string }
  | {
      state: "ended";
      outcomes: ShopOutcome[];
      tokensIn: number;
      tokensOut: number;
      costUsd: number;
      matchRate: number;
      parseFailures: number;
      /** False when the quote match rate is under 80%: write no scores from this batch. */
      passed: boolean;
      injectionShopIds: string[];
    };

/**
 * Collect one batch. `lookup` returns the pages and rule facts for a shop as
 * they were at submit time (the crawl runs after the collect step).
 */
export async function collectBatch(
  client: BatchClient,
  batchId: string,
  lookup: (shopId: string) => Promise<{ pages: CrawlPage[]; facts: RuleFacts; keurmerkVerified: boolean } | undefined>,
): Promise<CollectResult> {
  const batch = await client.messages.batches.retrieve(batchId);
  if (batch.processing_status !== "ended") return { state: "pending", status: batch.processing_status };

  const outcomes: ShopOutcome[] = [];
  let tokensIn = 0;
  let tokensOut = 0;
  let parseFailures = 0;
  const allChecks: QuoteCheck[] = [];
  const injectionShopIds: string[] = [];

  for await (const res of await client.messages.batches.results(batchId)) {
    const shopId = res.custom_id;
    if (res.result.type !== "succeeded") {
      outcomes.push({ shopId, kind: "failed", reason: res.result.type });
      continue;
    }
    const msg = res.result.message;
    tokensIn += msg.usage.input_tokens + (msg.usage.cache_read_input_tokens ?? 0) + (msg.usage.cache_creation_input_tokens ?? 0);
    tokensOut += msg.usage.output_tokens;
    const ctx = await lookup(shopId);
    if (!ctx) {
      outcomes.push({ shopId, kind: "failed", reason: "shop no longer in scope" });
      continue;
    }
    if (msg.stop_reason !== "end_turn") {
      parseFailures++;
      outcomes.push({ shopId, kind: "failed", reason: `stop_reason ${msg.stop_reason}` });
      continue;
    }
    const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    try {
      const parsed = parseAnswer(text, ctx.pages);
      allChecks.push(...parsed.checks);
      if (parsed.instructionsInData) injectionShopIds.push(shopId);
      const score = computeScore({
        ...parsed.signals,
        has_kvk: ctx.facts.hasKvk,
        product_count_est: ctx.facts.productCountEst,
        keurmerk_verified: ctx.keurmerkVerified,
      });
      outcomes.push({ shopId, kind: "scored", parsed, score });
    } catch (err) {
      if (!(err instanceof ParseError)) throw err;
      parseFailures++;
      outcomes.push({ shopId, kind: "failed", reason: err.message });
    }
  }

  const rate = matchRate(allChecks);
  const costUsd = (tokensIn * BATCH_USD_PER_MTOK.input + tokensOut * BATCH_USD_PER_MTOK.output) / 1_000_000;
  return {
    state: "ended",
    outcomes,
    tokensIn,
    tokensOut,
    costUsd: Math.round(costUsd * 10_000) / 10_000,
    matchRate: Math.round(rate * 1000) / 1000,
    parseFailures,
    passed: rate >= MIN_RUN_MATCH_RATE,
    injectionShopIds,
  };
}
