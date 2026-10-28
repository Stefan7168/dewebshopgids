// Gives a disputed shop its old status back once every dispute about it is answered
// (plan v3 section 7, step 9). Runs hourly as the `pipeline` role, the only role that may
// set `published`. A shop is restored only when:
// - no dispute is open, awaiting a person, or awaiting a confirmation link that is still valid;
// - every no-change reply has been sent.
// Expired confirmation links are closed. Answered disputes are marked resolved.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { CONFIRM_VALID_DAYS } from "../../lib/disputes/core";
import { revalidate } from "./enforce-removals";

export type DisputeState = { id: string; status: string; created_at: Date; reply_sent: boolean };
export type Decision = { restore: boolean; resolve: string[]; expire: string[] };

export function decideRestore(disputes: DisputeState[], now = new Date()): Decision {
  const expiry = now.getTime() - CONFIRM_VALID_DAYS * 86_400_000;
  const expire = disputes.filter((d) => d.status === "awaiting_confirmation" && d.created_at.getTime() < expiry).map((d) => d.id);
  const blocking = disputes.some(
    (d) =>
      d.status === "open" ||
      d.status === "awaiting_human" ||
      (d.status === "awaiting_confirmation" && !expire.includes(d.id)) ||
      (d.status === "agent_replied" && !d.reply_sent),
  );
  const resolve = blocking ? [] : disputes.filter((d) => d.status === "agent_replied").map((d) => d.id);
  return { restore: !blocking, resolve, expire };
}

type ShopRow = { id: string; slug: string; status_before_dispute: string };

export async function restoreStatus(sql: Sql, now = new Date()): Promise<{ summary: string; slugs: string[] }> {
  const shops = await sql<ShopRow[]>`
    select id, slug, status_before_dispute from public.shops
    where status = 'disputed' and status_before_dispute is not null`;
  const restored: ShopRow[] = [];
  let expired = 0;
  for (const shop of shops) {
    const disputes = await sql<DisputeState[]>`
      select d.id, d.status, d.created_at,
        exists (select 1 from public.email_queue q
                where q."to" = 'dispute:' || d.id::text and q.template = d.reply_template_id and q.sent_at is not null) as reply_sent
      from public.disputes d where d.shop_id = ${shop.id} and d.status <> 'resolved'`;
    const dec = decideRestore(disputes, now);
    for (const id of dec.expire) {
      await sql`
        update public.disputes set status = 'resolved', resolved_at = now(), resolved_note = 'Confirmation link expired unused.'
        where id = ${id} and status = 'awaiting_confirmation'`;
      expired++;
    }
    if (!dec.restore) continue;
    for (const id of dec.resolve) {
      await sql`update public.disputes set status = 'resolved', resolved_at = now() where id = ${id} and status = 'agent_replied'`;
    }
    const rows = await sql`
      update public.shops set status = status_before_dispute, status_before_dispute = null
      where id = ${shop.id} and status = 'disputed' returning id`;
    if (rows.length) restored.push(shop);
  }
  const slugs = restored.map((s) => s.slug);
  const parts = [restored.length ? `restored ${restored.length}: ${restored.map((s) => `${s.slug} to ${s.status_before_dispute}`).join(", ")}` : "nothing to restore"];
  if (expired) parts.push(`closed ${expired} expired confirmation(s)`);
  return { summary: parts.join("; "), slugs };
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "dispute-restore", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await restoreStatus(sql);
      await revalidate(r.slugs);
      console.log(r.summary);
      return { summary: r.summary };
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("restore-status.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
