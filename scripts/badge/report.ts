// Monthly click reports, run as the `pipeline` role on the 1st of the month (badge-report.yml). Counts last
// month's non-bot clicks per shop and queues one email each. Re-running the same month queues nothing new.
// - `badge_click_report` for shops with the paid "Geverifieerd" badge (plan v3 section 10).
// - `shop_click_report`, free, for other published shops whose owner used a claim link (plan v4 section 12,
//   "Launch+"; same consent rule as badge offers, migration 0022). Needs migration 0024 to read shop_claims.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";

/** "2026-10" for the month before `now`, with its start and end in UTC. */
export function previousMonth(now: Date): { month: string; start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { month: start.toISOString().slice(0, 7), start, end };
}

export async function queueBadgeReports(sql: Sql, now = new Date()): Promise<{ summary: string }> {
  const { month, start, end } = previousMonth(now);
  const rows = await sql<{ id: string }[]>`
    insert into public.email_queue (shop_id, template, slots, priority)
    select s.id, 'badge_click_report',
      jsonb_build_object('shop_name', s.name, 'shop_slug', s.slug, 'month', ${month}::text,
        'clicks', (select count(*) from public.clicks c
                   where c.shop_id = s.id and c.device <> 'bot' and c.occurred_at >= ${start} and c.occurred_at < ${end})),
      6
    from public.shops s
    where s.verified_badge_until >= current_date and s.contact_email is not null
      and not exists (select 1 from public.email_queue q
                      where q.shop_id = s.id and q.template = 'badge_click_report' and q.slots->>'month' = ${month})
    returning id`;
  return { summary: `queued ${rows.length} badge click report(s) for ${month}` };
}

export async function queueShopReports(sql: Sql, now = new Date()): Promise<{ summary: string }> {
  const { month, start, end } = previousMonth(now);
  try {
    const rows = await sql<{ id: string }[]>`
      insert into public.email_queue (shop_id, template, slots, priority)
      select s.id, 'shop_click_report',
        jsonb_build_object('shop_name', s.name, 'shop_slug', s.slug, 'month', ${month}::text,
          'clicks', (select count(*) from public.clicks c
                     where c.shop_id = s.id and c.device <> 'bot' and c.occurred_at >= ${start} and c.occurred_at < ${end})),
        7
      from public.shops s
      where s.status = 'published' and s.contact_email is not null and s.outreach_opt_out_at is null
        and (s.verified_badge_until is null or s.verified_badge_until < current_date)
        and exists (select 1 from public.shop_claims sc where sc.shop_id = s.id and sc.verified_at is not null)
        and not exists (select 1 from public.email_queue q
                        where q.shop_id = s.id and q.template = 'shop_click_report' and q.slots->>'month' = ${month})
      returning id`;
    return { summary: `queued ${rows.length} free shop report(s) for ${month}` };
  } catch (e) {
    // 42501: permission denied on shop_claims until migration 0024 runs; the badge reports still go out.
    if ((e as { code?: string }).code === "42501") return { summary: "free shop reports not available until migration 0024 runs" };
    throw e;
  }
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "badge-report", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const badge = await queueBadgeReports(sql);
      const free = await queueShopReports(sql);
      const r = { summary: `${badge.summary}; ${free.summary}` };
      console.log(r.summary);
      return r;
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("report.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
