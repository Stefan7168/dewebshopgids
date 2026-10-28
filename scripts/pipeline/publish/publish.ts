// Pre-notice and publish job (plan v3 section 8, step 9). Runs in the nightly pipeline as
// the `pipeline` role, the only role that may set `published`.
// 1. publish: a prenotified shop goes live once its pre-notice email was sent 7+ days ago,
//    it still qualifies, and nobody disputed it in the meantime (a dispute sets `disputed`).
// 2. prenotice: a qualifying draft shop gets the pre-notice email (to `contact_email`, through
//    a `prenotice` disputes row) and becomes `prenotified`. Off until agent_settings
//    `prenotice_enabled` is true: the /herbeoordeling link in the email must work publicly.
import type { Sql } from "../../../agents/shared/audit";
import { keurmerkText, onlineSince, productCountText, scoreDisplay, type PublicShop } from "../../../lib/shops/present";
import type { PrenoticeSlots } from "../../../lib/email/prenotice";
import { revalidate } from "../../disputes/enforce-removals";

export const NOTICE_DAYS = 7;
export const MAX_NOTICES_PER_NIGHT = 30; // Resend free sends 100 a day; leave room for other mail

export type Candidate = {
  id: string;
  slug: string;
  name: string;
  contact_email: string | null;
  score: number | null;
  score_label: string | null;
  keurmerk: string[];
  keurmerk_status: PublicShop["keurmerk_status"];
  product_count_est: number | null;
  domain_first_seen: Date | null;
  band: string | null; // scores.sub_scores.band of the newest score
  enough_signals: boolean | null;
  verdicts: string[]; // auditor verdicts on the newest score
};

/** Why a shop may not go public yet, or null when it may. */
export function blockReason(c: Candidate): string | null {
  if (!c.band) return "no score";
  if (c.enough_signals !== true) return "fewer than 4 valid signals";
  if (c.verdicts.includes("escalate")) return "auditor escalated";
  if (c.band === "audit_required" && !c.verdicts.includes("agree")) return "30 to 40 band without auditor agreement";
  if (!c.contact_email) return "no contact email for the pre-notice";
  return null;
}

async function candidates(sql: Sql, status: "draft" | "prenotified") {
  return sql<Candidate[]>`
    with latest as (
      select distinct on (shop_id) shop_id, created_at, sub_scores from public.scores order by shop_id, created_at desc
    )
    select s.id, s.slug, s.name, s.contact_email, s.score, s.score_label, s.keurmerk, s.keurmerk_status,
      s.product_count_est, s.domain_first_seen,
      l.sub_scores ->> 'band' as band, (l.sub_scores ->> 'enough_signals')::boolean as enough_signals,
      coalesce((select array_agg(c.verdict) from public.score_checks c where c.shop_id = s.id and c.checked_at > l.created_at), '{}') as verdicts
    from public.shops s left join latest l on l.shop_id = s.id
    where s.status = ${status}
      and (${status} = 'draft' or exists (
        select 1 from public.disputes d join public.email_queue q on q."to" = 'dispute:' || d.id::text
        where d.shop_id = s.id and d.type = 'prenotice' and q.sent_at <= now() - ${`${NOTICE_DAYS} days`}::interval))
    order by s.created_at`;
}

/** Slots for the prenotice email: the texts the page will show, from our own data only. */
export function prenoticeSlots(c: Candidate, publishOn: string): PrenoticeSlots {
  const d = scoreDisplay({ score: c.score, score_label: c.score_label });
  return {
    shop_name: c.name,
    shop_slug: c.slug,
    publish_on: publishOn,
    score_text: d.kind === "number" ? `${d.value} van 100` : d.kind === "label" ? d.text : "Nog geen score",
    keurmerk_text: keurmerkText(c),
    online_since: onlineSince(c.domain_first_seen ? c.domain_first_seen.toISOString() : null),
    products_text: productCountText(c.product_count_est),
  };
}

export async function publishDue(sql: Sql): Promise<{ summary: string; slugs: string[] }> {
  const due = await candidates(sql, "prenotified");
  const published: string[] = [];
  const held: string[] = [];
  for (const c of due) {
    const why = blockReason(c);
    if (why) {
      held.push(`${c.slug} (${why})`);
      continue;
    }
    const rows = await sql`update public.shops set status = 'published' where id = ${c.id} and status = 'prenotified' returning id`;
    if (rows.length) published.push(c.slug);
  }
  return {
    summary: `published ${published.length}` + (published.length ? `: ${published.join(", ")}` : "") + (held.length ? `; held: ${held.join(", ")}` : ""),
    slugs: published,
  };
}

export async function sendPrenotices(sql: Sql, now = new Date()): Promise<{ summary: string }> {
  const [flag] = await sql<{ value: unknown }[]>`select value from public.agent_settings where key = 'prenotice_enabled'`;
  if (flag?.value !== true) return { summary: "pre-notice off (agent_settings.prenotice_enabled is not true)" };
  const drafts = await candidates(sql, "draft");
  const ready = drafts.filter((c) => blockReason(c) === null).slice(0, MAX_NOTICES_PER_NIGHT);
  const publishOn = new Date(now.getTime() + NOTICE_DAYS * 86_400_000).toISOString();
  for (const c of ready) {
    await sql.begin(async (tx) => {
      const [d] = await tx<{ id: string }[]>`
        insert into public.disputes (shop_id, email, type, status, resolved_note, deadline_at, resolved_at)
        values (${c.id}, ${c.contact_email!}, 'prenotice', 'resolved', 'Pre-notice log row.', ${publishOn}, now())
        returning id`;
      await tx`insert into public.email_queue ("to", shop_id, template, slots, priority)
               values (${`dispute:${d.id}`}, ${c.id}, 'prenotice', ${tx.json(prenoticeSlots(c, publishOn))}, 3)`;
      await tx`update public.shops set status = 'prenotified' where id = ${c.id} and status = 'draft'`;
    });
  }
  const blocked = drafts.length - drafts.filter((c) => blockReason(c) === null).length;
  return { summary: `pre-noticed ${ready.length}; not ready ${blocked}` };
}

/** 30 to 40 band: the number shows once the auditor agreed with the newest score (lib/shops/present.ts). */
export async function clearAuditLabels(sql: Sql): Promise<string[]> {
  const rows = await sql<{ slug: string; status: string }[]>`
    with latest as (
      select distinct on (shop_id) shop_id, created_at from public.scores order by shop_id, created_at desc
    )
    update public.shops s set score_label = null
    from latest l
    where l.shop_id = s.id and s.score_label = 'audit_required'
      and exists (select 1 from public.score_checks c where c.shop_id = s.id and c.checked_at > l.created_at and c.verdict = 'agree')
      and not exists (select 1 from public.score_checks c where c.shop_id = s.id and c.checked_at > l.created_at and c.verdict = 'escalate')
    returning s.slug, s.status`;
  return rows.filter((r) => r.status === "published" || r.status === "disputed").map((r) => r.slug);
}

export async function runPublish(sql: Sql): Promise<{ summary: string }> {
  const cleared = await clearAuditLabels(sql);
  const p = await publishDue(sql);
  await revalidate([...cleared, ...p.slugs]);
  const n = await sendPrenotices(sql);
  return { summary: `${p.summary}. ${n.summary}. Live pages that now show their 30 to 40 score: ${cleared.length}` };
}
