// Monday 06:00 (plan v3 section 8 step 12): after a green nightly run, create this week's gids
// issue with its frozen inputs_snapshot. Pipeline role. Idempotent: an existing issue is kept.
// Exit code 75 means "nightly not green yet": the workflow retries in an hour, max 3 times.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { pickGuideShops, type GuideCandidate, type GuideSnapshot } from "../../lib/guide/inputs";
import { amsterdamDate, issueForSendWeek } from "../../lib/guide/week";
import { keurmerkText, onlineSince, productCountText } from "../../lib/shops/present";

export class NightlyNotGreen extends Error {}

/** The editor only ever sees a keurmerk we confirmed with the keurmerkorganisatie. An unchecked one is
 * not named at all: a draft could quote the name and drop "nog niet gecontroleerd" (QA round 5, part 7). */
export function guideKeurmerkText(s: { keurmerk: string[]; keurmerk_status: "none" | "unverified" | "verified" }): string {
  return s.keurmerk_status === "verified" && s.keurmerk.length ? keurmerkText(s) : "geen gecontroleerd keurmerk";
}

type Row = {
  id: string; slug: string; name: string; category: string | null; score: number | null; score_label: string | null;
  keurmerk: string[]; keurmerk_status: "none" | "unverified" | "verified"; domain_first_seen: Date | null;
  product_count_est: number | null; store_city: string | null; description_nl: string | null;
  first_published_at: Date | null; score_before: number | null; clicks: number; featured_before: boolean;
};

export async function loadCandidates(sql: Sql, start: Date, end: Date): Promise<GuideCandidate[]> {
  const rows = await sql<Row[]>`
    select s.id, s.slug, s.name, c.name_nl as category, s.score, s.score_label, s.keurmerk, s.keurmerk_status,
           s.domain_first_seen, s.product_count_est, s.store_city, s.description_nl, s.first_published_at,
           (select x.total from public.scores x where x.shop_id = s.id and x.created_at < ${start}
             order by x.created_at desc limit 1) as score_before,
           (select count(*)::int from public.clicks k where k.shop_id = s.id and k.occurred_at >= ${start} and k.occurred_at < ${end}) as clicks,
           exists (select 1 from public.guide_issues g where s.id = any(g.shop_ids) and g.status in ('published', 'sent')) as featured_before
    from public.shops s left join public.categories c on c.id = s.category_id
    where s.status = 'published'`;
  return rows.map((r) => ({
    id: r.id, slug: r.slug, name: r.name, category: r.category, score: r.score, score_label: r.score_label,
    keurmerk: guideKeurmerkText(r), online_since: onlineSince(r.domain_first_seen?.toISOString() ?? null),
    products: productCountText(r.product_count_est), city: r.store_city, description: r.description_nl,
    first_published_at: r.first_published_at?.toISOString() ?? null, score_before: r.score_before, clicks: r.clicks,
    featured_before: r.featured_before,
  }));
}

export async function nightlyGreenToday(sql: Sql, now: Date): Promise<boolean> {
  const [row] = await sql<{ status: string; checked_at: Date }[]>`
    select status, checked_at from public.health_checks
    where "check" = 'failed_runs' and detail ->> 'source' = 'nightly' order by checked_at desc limit 1`;
  return !!row && row.status === "ok" && amsterdamDate(row.checked_at).getTime() === amsterdamDate(now).getTime();
}

export async function prepareIssue(sql: Sql, now = new Date()): Promise<{ summary: string }> {
  const issue = issueForSendWeek(now);
  const [existing] = await sql`select id from public.guide_issues where slug = ${issue.slug}`;
  if (existing) return { summary: `${issue.slug} already exists` };
  if (!(await nightlyGreenToday(sql, now))) throw new NightlyNotGreen("tonight's nightly run is not green yet");
  const shops = pickGuideShops(await loadCandidates(sql, issue.windowStart, issue.windowEnd), issue.windowStart, issue.windowEnd);
  const snapshot: GuideSnapshot = { slug: issue.slug, window: { start: issue.windowStart.toISOString(), end: issue.windowEnd.toISOString() }, shops };
  await sql`
    insert into public.guide_issues (iso_year, iso_week, slug, inputs_snapshot)
    values (${issue.year}, ${issue.week}, ${issue.slug}, ${sql.json(snapshot as never)})
    on conflict (slug) do nothing`;
  return { summary: `${issue.slug} created with ${shops.length} shop(s): ${shops.map((s) => `${s.slug} (${s.reason})`).join(", ") || "none"}` };
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "guide-prepare", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await prepareIssue(sql);
      console.log(r.summary);
      return r;
    });
  } catch (err) {
    console.error(err);
    process.exitCode = err instanceof NightlyNotGreen ? 75 : 1;
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("prepare.ts")) void main();
