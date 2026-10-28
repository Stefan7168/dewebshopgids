// Sends due email_queue rows through Resend (plan v3 section 7). Runs as the `pipeline`
// role after the escalations and schedule-gaps jobs, so owner alerts go out within 90 minutes.
// Agents only queue rows; this code picks the recipient and the text.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { TEMPLATES, type Rendered } from "../../lib/email/templates";

export const MAX_PER_RUN = 50;

type Row = { id: string; to: string | null; shop_id: string | null; template: string; slots: Record<string, unknown>; dispute_email?: string | null };
export type SendEmail = (msg: Rendered & { to: string; idempotencyKey: string }) => Promise<void>;

export function resendSender(apiKey = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM): SendEmail {
  if (!apiKey || !from) throw new Error("RESEND_API_KEY and EMAIL_FROM are required");
  return async (m) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      // The queue row id as idempotency key: a retry after a crash never sends twice.
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": m.idempotencyKey },
      body: JSON.stringify({ from, to: [m.to], subject: m.subject, text: m.text }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  };
}

/** Owner mail goes to OWNER_EMAIL, dispute replies to the address on that dispute. Shop mail is not wired yet (pre-notice job). */
function recipientFor(row: Row, ownerEmail: string | undefined): string | null {
  const t = TEMPLATES[row.template];
  if (t?.recipient === "owner") return row.to === "owner" && ownerEmail ? ownerEmail : null;
  if (t?.recipient === "dispute") return /^dispute:[0-9a-f-]{36}$/.test(row.to ?? "") && row.dispute_email ? row.dispute_email : null;
  return null;
}

export async function sendQueue(sql: Sql, send: SendEmail, ownerEmail = process.env.OWNER_EMAIL): Promise<{ summary: string }> {
  const sendable = Object.entries(TEMPLATES).filter(([, t]) => t.recipient !== "internal").map(([k]) => k);
  const rows = await sql<Row[]>`
    select q.id, q."to", q.shop_id, q.template, q.slots, d.email as dispute_email
    from public.email_queue q left join public.disputes d on q."to" = 'dispute:' || d.id::text
    where q.sent_at is null and q.send_after <= now() and q.template = any(${sendable})
    order by q.priority, q.send_after limit ${MAX_PER_RUN}`;
  let sent = 0;
  const skipped: string[] = [];
  for (const row of rows) {
    const to = recipientFor(row, ownerEmail);
    const t = TEMPLATES[row.template];
    const msg = to && t.recipient !== "internal" ? t.render(row.slots ?? {}) : null;
    if (!to || !msg) {
      skipped.push(`${row.id} (${row.template})`);
      continue;
    }
    await send({ ...msg, to, idempotencyKey: `email_queue/${row.id}` });
    await sql`update public.email_queue set sent_at = now() where id = ${row.id}`;
    sent++;
  }
  // A skipped row stays unsent and shows up here every run until someone fixes it.
  return { summary: `sent ${sent} of ${rows.length}` + (skipped.length ? `; skipped (no recipient or bad slots): ${skipped.join(", ")}` : "") };
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "email-sender", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await sendQueue(sql, resendSender());
      console.log(r.summary);
      return r;
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("send-queue.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
