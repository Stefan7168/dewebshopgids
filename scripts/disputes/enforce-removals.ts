// Hourly backstop for confirmed removals and objections (plan v3 section 7, step 9).
// The confirm action removes the shop at once; this job catches any confirmation whose
// removal did not land, so the 48-hour duty holds even when the action failed halfway.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";

type Row = { dispute_id: string; shop_id: string; slug: string };

export async function enforceRemovals(sql: Sql): Promise<{ summary: string; slugs: string[] }> {
  const rows = await sql<Row[]>`
    select d.id as dispute_id, s.id as shop_id, s.slug
    from public.disputes d join public.shops s on s.id = d.shop_id
    where d.type in ('removal', 'objection') and d.confirmed_at is not null
      and (s.status <> 'removed' or d.status <> 'resolved')`;
  for (const r of rows) {
    await sql`update public.shops set status = 'removed' where id = ${r.shop_id} and status <> 'removed'`;
    await sql`
      update public.disputes set status = 'resolved', resolved_at = coalesce(resolved_at, now()),
        resolved_note = coalesce(resolved_note, 'Removed by the hourly job after confirmation.')
      where id = ${r.dispute_id}`;
  }
  const slugs = [...new Set(rows.map((r) => r.slug))];
  return { summary: rows.length ? `removed ${slugs.length} shop(s): ${slugs.join(", ")}` : "nothing to remove", slugs };
}

/** Best effort: without REVALIDATE_URL the page drops out of the cache within the hour (cacheLife "hours"). */
async function revalidate(slugs: string[]): Promise<void> {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret || slugs.length === 0) return;
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ paths: ["/", ...slugs.map((s) => `/webshop/${s}`)] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) console.error(`revalidate ${res.status}`);
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "dispute-removals", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await enforceRemovals(sql);
      await revalidate(r.slugs);
      console.log(r.summary);
      return { summary: r.summary };
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("enforce-removals.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
