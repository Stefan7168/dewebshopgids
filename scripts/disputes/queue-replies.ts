// Queues the Dispute Handler's chosen reply (template id + typed slots) as an email_queue row
// (plan v3 section 7, step 9). Code adds the shop name and link and validates the slots again;
// a reply that fails validation goes to a person instead of the shop.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { validateReplySlots } from "../../lib/disputes/replies";

type Row = { id: string; reply_template_id: string; reply_slots: unknown; shop_name: string; shop_slug: string };

export async function queueReplies(sql: Sql): Promise<{ summary: string }> {
  const rows = await sql<Row[]>`
    select d.id, d.reply_template_id, d.reply_slots, s.name as shop_name, s.slug as shop_slug
    from public.disputes d join public.shops s on s.id = d.shop_id
    where d.status = 'agent_replied' and d.reply_template_id is not null
      and not exists (
        select 1 from public.email_queue q
        where q."to" = 'dispute:' || d.id::text and q.template = d.reply_template_id)`;
  let queued = 0;
  const rejected: string[] = [];
  for (const r of rows) {
    const v = validateReplySlots(r.reply_template_id, r.reply_slots);
    if (!v.ok) {
      rejected.push(r.id);
      await sql`update public.disputes set status = 'awaiting_human' where id = ${r.id}`;
      await sql`
        insert into public.agent_escalations (agent, kind, title, body_md, label)
        values ('dispute-replies', 'reply_rejected', ${`Antwoord op dispute voor ${r.shop_slug} afgekeurd door de validator`},
          ${`Dispute \`${r.id}\`: the reply was not sent. Validator: ${v.errors.join("; ").slice(0, 1500)}`}, 'needs-human')`;
      continue;
    }
    const { template, ...reply } = v.slots;
    await sql`
      insert into public.email_queue ("to", template, slots, priority)
      values (${`dispute:${r.id}`}, ${template}, ${sql.json({ reply, shop_name: r.shop_name, shop_slug: r.shop_slug })}, 2)`;
    queued++;
  }
  return { summary: `queued ${queued} repl${queued === 1 ? "y" : "ies"}` + (rejected.length ? `; rejected and sent to a person: ${rejected.join(", ")}` : "") };
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "dispute-replies", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await queueReplies(sql);
      console.log(r.summary);
      return r;
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("queue-replies.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
