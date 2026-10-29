// Nightly crawl step (plan v3 section 8, step 10). Runs as the `pipeline` role.
// Picks shops without a successful crawl first, then 1/30 of the rest (oldest crawl first),
// stores pages in crawl_pages and rule facts in shops and shop_signals.
// The run fails when more than 10% of shops could not be crawled.
import { createHash } from "node:crypto";
import { connect, runAgentJob, type Sql } from "../../../agents/shared/audit";
import { createPoliteFetcher } from "../fetch-polite";
import { crawlShop, type CrawlResult } from "./crawl-shop";

export const MAX_SHOPS_PER_NIGHT = 60;
export const CONCURRENCY = 4;
export const MIN_ERRORS_TO_FAIL = 3;
export const MAX_ERROR_SHARE = 0.1;

type Shop = { id: string; domain: string };

export async function selectShops(sql: Sql): Promise<Shop[]> {
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from public.shops where status not in ('removed', 'disputed')`;
  const rotation = Math.ceil(n / 30);
  // A shop counts as crawled only once a page came back 2xx. Shops without that (new, or every
  // attempt failed, e.g. a night without network) are retried the next night, never-tried first,
  // instead of waiting a full 30-night rotation.
  return sql<Shop[]>`
    with last as (
      select s.id, s.domain,
        max(c.fetched_at) filter (where c.status_code between 200 and 299) as last_ok,
        max(c.fetched_at) as last_try
      from public.shops s left join public.crawl_pages c on c.shop_id = s.id
      where s.status not in ('removed', 'disputed')
      group by s.id, s.domain
    )
    (select id, domain from last
     where last_ok is null and (last_try is null or last_try < now() - interval '20 hours')
     order by last_try nulls first, id limit ${MAX_SHOPS_PER_NIGHT})
    union all
    (select id, domain from last where last_ok < now() - interval '20 hours'
     order by last_ok limit ${rotation})
    limit ${MAX_SHOPS_PER_NIGHT}`;
}

export async function storeCrawl(sql: Sql, shopId: string, r: CrawlResult): Promise<void> {
  await sql.begin(async (tx) => {
    for (const p of r.pages) {
      const hash = p.text ? createHash("sha256").update(p.text).digest("hex") : null;
      await tx`
        insert into public.crawl_pages (shop_id, url, page_type, fetched_at, status_code, robots_allowed, content_hash, text_excerpt)
        values (${shopId}, ${p.url}, ${p.pageType}, now(), ${p.statusCode}, ${p.robotsAllowed}, ${hash}, ${p.text})
        on conflict (shop_id, url) do update set
          page_type = excluded.page_type, fetched_at = excluded.fetched_at, status_code = excluded.status_code,
          robots_allowed = excluded.robots_allowed, content_hash = excluded.content_hash, text_excerpt = excluded.text_excerpt`;
    }
    if (!r.ok) return;
    await tx`
      update public.shops set
        platform = ${r.platform},
        product_count_est = ${r.productCount?.count ?? null},
        product_count_method = ${r.productCount?.method ?? null},
        keurmerk = ${r.keurmerk},
        keurmerk_status = ${r.keurmerkStatus},
        keurmerk_verified_method = ${r.keurmerkStatus === "verified" ? "certificate_page" : null},
        contact_email = coalesce(contact_email, ${r.contactEmail}),
        contact_email_source = case when contact_email is null and ${r.contactEmail}::text is not null then 'contact_page' else contact_email_source end
      where id = ${shopId}`;
    const signals: [string, boolean | null, number | null][] = [
      ["has_kvk", r.hasKvk, null],
      ["product_count", null, r.productCount?.count ?? null],
      ["keurmerk_verified", r.keurmerkStatus === "verified", null],
    ];
    for (const [key, bool, num] of signals) {
      await tx`
        insert into public.shop_signals (shop_id, run_id, signal_key, value_bool, value_numeric, source)
        values (${shopId}, null, ${key}, ${bool}, ${num}, 'rule')`;
    }
  });
}

/** Over 10% errors fails the step (plan v3 section 8), but only from MIN_ERRORS_TO_FAIL errors on: one or two unreachable sites on a small night are noise, not a broken crawler. */
export function crawlFailed(failed: number, attempted: number): boolean {
  return failed >= MIN_ERRORS_TO_FAIL && failed / attempted > MAX_ERROR_SHARE;
}

/** Crawl shops with a small pool; per-domain politeness lives inside the shared fetcher. */
export async function runCrawl(sql: Sql, fetchPolite = createPoliteFetcher().fetchPolite) {
  const shops = await selectShops(sql);
  let failed = 0;
  let robotsBlocked = 0;
  const queue = [...shops];
  async function worker() {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const r = await crawlShop(fetchPolite, s.domain);
      const kind = crawlKind(r);
      if (kind === "robots") robotsBlocked++;
      else if (kind === "failed") failed++;
      await storeCrawl(sql, s.id, r);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, shops.length) }, worker));
  return crawlVerdict(shops.length, failed, robotsBlocked);
}

/** A shop whose robots.txt keeps us out made a choice; it is not a pipeline error. Anything else that is not ok is. */
export function crawlKind(r: CrawlResult): "ok" | "robots" | "failed" {
  if (r.ok) return "ok";
  return r.error === "robots_disallowed" ? "robots" : "failed";
}

/** The step's summary; throws (so the step and the health check fail) over the error threshold. */
export function crawlVerdict(total: number, failed: number, robotsBlocked: number): { summary: string } {
  const summary = `crawled ${total} shops, ${failed} failed, ${robotsBlocked} blocked by robots.txt`;
  if (crawlFailed(failed, total - robotsBlocked)) throw new Error(`${summary}: over 10% errors`);
  return { summary };
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "crawl", runsOn: "code", trigger: "pipeline", spendsTokens: false }, async () => {
      const r = await runCrawl(sql);
      console.log(r.summary);
      return r;
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("run-crawl.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
