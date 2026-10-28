// Nightly scoring step (plan v3 section 8, steps 7 and 8). Runs as the `pipeline`
// role: first collects ended batches and writes signals and scores, then submits
// one new batch for shops whose crawl is newer than their score.
import Anthropic from "@anthropic-ai/sdk";
import { connect, runAgentJob, type Sql } from "../../../agents/shared/audit";
import { yearsOnline } from "../../../lib/scoring/compute";
import { MARKETPLACE_LABEL } from "../../../lib/scoring/weights";
import { collectBatch, scoreBatch, type BatchClient, type ScoreItem } from "./batch";
import { PAGE_IDS, PROMPT_VERSION, SCORING_MODEL, type CrawlPage } from "./prompt";

export const MAX_SHOPS_PER_BATCH = 100;
const PAGE_ORDER = ["home", "about", "contact", "product", "collection"];

type ShopRow = { id: string; name: string; domain: string; product_count_est: number | null; platform: string | null; keurmerk_status: string; domain_first_seen: string | Date | null };

async function loadItem(sql: Sql, shop: ShopRow): Promise<ScoreItem & { keurmerkVerified: boolean }> {
  const rows = await sql<{ url: string; page_type: string; text_excerpt: string }[]>`
    select url, page_type, text_excerpt from public.crawl_pages
    where shop_id = ${shop.id} and robots_allowed and status_code = 200 and text_excerpt is not null
      and page_type = any(${PAGE_ORDER})`;
  const pages: CrawlPage[] = rows
    .sort((a, b) => PAGE_ORDER.indexOf(a.page_type) - PAGE_ORDER.indexOf(b.page_type) || a.url.localeCompare(b.url))
    .slice(0, PAGE_IDS.length)
    .map((r) => ({ url: r.url, pageType: r.page_type, text: r.text_excerpt }));
  const [kvk] = await sql<{ value_bool: boolean | null }[]>`
    select value_bool from public.shop_signals
    where shop_id = ${shop.id} and signal_key = 'has_kvk' and source = 'rule'
    order by created_at desc limit 1`;
  return {
    shopId: shop.id,
    shop: { name: shop.name, domain: shop.domain },
    pages,
    facts: {
      productCountEst: shop.product_count_est,
      platform: shop.platform,
      hasKvk: kvk?.value_bool ?? null,
      yearsOnline: yearsOnline(shop.domain_first_seen),
    },
    keurmerkVerified: shop.keurmerk_status === "verified",
  };
}

const SHOP_COLS = "id, name, domain, product_count_est, platform, keurmerk_status, domain_first_seen";

/** Collect every open batch. `failed` is true when a batch was under the 80% quote match rate. */
export async function collectBatches(sql: Sql, client: BatchClient): Promise<{ notes: string[]; failed: boolean }> {
  const notes: string[] = [];
  let failed = false;
  const open = await sql<{ id: string; batch_id: string }[]>`
    select id, batch_id from public.score_runs where batch_status in ('submitted', 'in_progress') order by started_at`;
  for (const run of open) {
    const lookup = async (shopId: string) => {
      const [shop] = await sql<ShopRow[]>`select ${sql.unsafe(SHOP_COLS)} from public.shops where id = ${shopId}`;
      return shop ? loadItem(sql, shop) : undefined;
    };
    const res = await collectBatch(client, run.batch_id, lookup);
    if (res.state === "pending") {
      await sql`update public.score_runs set batch_status = 'in_progress' where id = ${run.id}`;
      notes.push(`batch ${run.batch_id} ${res.status}`);
      continue;
    }

    let scored = 0;
    await sql.begin(async (tx) => {
      for (const o of res.outcomes) {
        if (o.kind !== "scored") continue;
        for (const r of o.parsed.rows) {
          await tx`
            insert into public.shop_signals (shop_id, run_id, signal_key, value_bool, value_numeric, evidence_quote, evidence_url, quote_verified, match_ratio, source)
            values (${o.shopId}, ${run.id}, ${r.signalKey}, ${r.valueBool}, ${r.valueNumeric}, ${r.evidenceQuote}, ${r.evidenceUrl}, ${r.quoteVerified}, ${r.matchRatio}, 'llm')`;
        }
        if (!res.passed) continue; // signals are kept for the audit trail, scores are not written
        const s = o.score;
        const label = s.band.display === "label" ? MARKETPLACE_LABEL : s.band.display === "audit_required" ? "audit_required" : null;
        await tx`
          insert into public.scores (shop_id, run_id, score_version, total, sub_scores, caps_applied, model, prompt_version)
          values (${o.shopId}, ${run.id}, ${s.scoreVersion}, ${s.total},
                  ${tx.json({ ...s.subScores, valid_signals: s.validSignals, enough_signals: s.enoughSignals, band: s.band.display })},
                  ${s.capsApplied}, ${SCORING_MODEL}, ${PROMPT_VERSION})`;
        const p = o.parsed.profile;
        await tx`
          update public.shops set score = ${s.total}, score_version = ${s.scoreVersion}, score_label = ${label},
            price_level = ${p.priceLevel}, has_physical_store = ${p.hasPhysicalStore}, store_city = ${p.storeCity},
            ships_from_country = ${p.shipsFromCountry}, description_nl = coalesce(${p.descriptionNl}, description_nl)
          where id = ${o.shopId}`;
        scored++;
      }
      await tx`
        update public.score_runs set batch_status = 'collected', finished_at = now(), shops_scored = ${scored},
          parse_failures = ${res.parseFailures}, quote_match_rate = ${res.matchRate}, cost_usd = ${res.costUsd},
          status = ${res.passed ? "ok" : "failed"}
        where id = ${run.id}`;
      await tx`
        update public.agent_settings set value = to_jsonb(round((value #>> '{}')::numeric + ${res.costUsd}, 4))
        where key = 'month_spend_usd'`;
    });
    if (!res.passed) failed = true;
    const shopFailures = res.outcomes.filter((o) => o.kind === "failed").length;
    notes.push(
      `batch ${run.batch_id}: scored ${scored}, failed ${shopFailures}, match rate ${res.matchRate}, cost USD ${res.costUsd}` +
        (res.passed ? "" : " (FAILED: match rate under 0.8, no scores written)") +
        (res.injectionShopIds.length ? `; instructions found in shop data: ${res.injectionShopIds.join(", ")}` : ""),
    );
  }
  return { notes, failed };
}

export async function submitIfIdle(sql: Sql, client: BatchClient): Promise<string> {
  const [open] = await sql`select 1 from public.score_runs where batch_status in ('submitted', 'in_progress') limit 1`;
  if (open) return "batch still open, nothing submitted";
  const shops = await sql<ShopRow[]>`
    select ${sql.unsafe(SHOP_COLS.split(", ").map((c) => `s.${c}`).join(", "))}
    from public.shops s
    where s.status in ('draft', 'prenotified', 'published', 'hidden')
      and exists (select 1 from public.crawl_pages c where c.shop_id = s.id and c.page_type = 'home' and c.status_code = 200)
      and not exists (
        select 1 from public.scores sc
        where sc.shop_id = s.id and sc.prompt_version = ${PROMPT_VERSION}
          and sc.created_at > (select max(c.fetched_at) from public.crawl_pages c where c.shop_id = s.id))
    order by s.created_at
    limit ${MAX_SHOPS_PER_BATCH}`;
  if (shops.length === 0) return "no shops need scoring";
  const items = [];
  for (const s of shops) items.push(await loadItem(sql, s));
  const { batchId, submitted } = await scoreBatch(client, items);
  await sql`
    insert into public.score_runs (batch_id, batch_status, shops_submitted, status)
    values (${batchId}, 'submitted', ${submitted}, 'running')`;
  return `submitted ${submitted} shops in batch ${batchId}`;
}

async function main() {
  const sql = connect();
  const client = new Anthropic();
  try {
    await runAgentJob(sql, { agent: "scoring", runsOn: "code", trigger: "pipeline" }, async () => {
      const { notes, failed } = await collectBatches(sql, client);
      notes.push(await submitIfIdle(sql, client));
      const summary = notes.join(" | ");
      console.log(summary);
      if (failed) throw new Error(summary);
      return { summary };
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("run-scoring.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
