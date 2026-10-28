// Monthly click report for shops with the paid "Geverifieerd" badge (plan v3 section 10).
// Runs as the `pipeline` role on the 1st of the month: counts last month's non-bot clicks per
// badge shop and queues one `badge_click_report` email each. Re-running the same month queues nothing new.
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

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "badge-report", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await queueBadgeReports(sql);
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
