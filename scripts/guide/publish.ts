// Gids publisher and sender (plan v3 section 8 step 12). Code, pipeline role. Two crons per
// slot (summer and winter time) start it; it acts only at 10:00 Amsterdam time.
// - Wednesday 10:00: a draft that has not passed the Fact Checker becomes the code fallback page.
// - Thursday 10:00: publish the page. Send the email only when it is approved (G2 tap) or, once
//   G2 is lifted (agent_settings gates.G2 = false, as on /admin), fact-checked. Otherwise the page is
//   published and the email is skipped that week (the G2 safe default).
// The email goes as one Resend Broadcast to the gids segment and links only to our own pages.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { fallbackIssue } from "../../lib/guide/fallback";
import type { GuideSnapshot } from "../../lib/guide/inputs";
import { guideHtml, parseGuideMarkdown } from "../../lib/guide/markdown";
import { issueForSendWeek } from "../../lib/guide/week";
import { SITE } from "../../lib/site";

type Issue = {
  id: string; slug: string; status: string; title_nl: string | null; intro_nl: string | null; body_md: string | null;
  inputs_snapshot: GuideSnapshot; resend_broadcast_id: string | null;
};
export type SendBroadcast = (b: { subject: string; html: string; name: string }) => Promise<string>;

export function slotFor(now: Date): "fallback" | "send" | null {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const day = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  if (hour !== 10) return null;
  return day === "Wed" ? "fallback" : day === "Thu" ? "send" : null;
}

export function emailHtml(i: Pick<Issue, "slug" | "title_nl" | "intro_nl" | "body_md">): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return [
    `<h1>${esc(i.title_nl ?? "")}</h1>`,
    i.intro_nl ? `<p>${esc(i.intro_nl)}</p>` : "",
    guideHtml(parseGuideMarkdown(i.body_md ?? ""), SITE.url),
    `<p><a href="${SITE.url}/gids/${i.slug}">Lees deze gids op de website</a></p>`,
    `<p style="font-size:12px;color:#666">${esc(SITE.name)} · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Afmelden</a></p>`,
  ].filter(Boolean).join("\n");
}

/** Resend Broadcasts: https://resend.com/docs/api-reference/broadcasts/create-broadcast */
export function resendBroadcaster(apiKey = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM, segmentId = process.env.RESEND_GUIDE_SEGMENT_ID): SendBroadcast | null {
  if (!apiKey || !from || !segmentId) return null;
  return async ({ subject, html, name }) => {
    const res = await fetch("https://api.resend.com/broadcasts", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ segment_id: segmentId, from, subject, html, name, send: true }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !body.id) throw new Error(`resend broadcast ${res.status}: ${body.message ?? "no id"}`);
    return body.id;
  };
}

async function revalidateGuide(slug: string) {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ paths: ["/gids", `/gids/${slug}`] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) console.error(`revalidate ${res.status}`);
}

export async function runGuidePublish(sql: Sql, slot: "fallback" | "send", now: Date, send: SendBroadcast | null): Promise<{ summary: string; slug?: string }> {
  const { slug } = issueForSendWeek(now);
  const [issue] = await sql<Issue[]>`
    select id, slug, status, title_nl, intro_nl, body_md, inputs_snapshot, resend_broadcast_id from public.guide_issues where slug = ${slug}`;
  if (!issue) return { summary: `${slug}: no issue (prepare did not run)` };

  if (issue.status === "draft" || issue.status === "rejected") {
    const f = fallbackIssue(issue.inputs_snapshot);
    await sql`
      update public.guide_issues set title_nl = ${f.title_nl}, intro_nl = ${f.intro_nl}, body_md = ${f.body_md},
        shop_ids = ${f.shop_ids}, status = 'fallback', published_at = now()
      where id = ${issue.id} and status in ('draft', 'rejected')`;
    return { summary: `${slug}: draft did not pass the Fact Checker; fallback page published, no email`, slug };
  }
  if (slot === "fallback") return { summary: `${slug}: ${issue.status}, nothing to do on Wednesday` };
  if (issue.status === "fallback" || issue.status === "sent") return { summary: `${slug}: already ${issue.status}` };

  const [gates] = await sql<{ value: Record<string, unknown> | null }[]>`select value from public.agent_settings where key = 'gates'`;
  const g2Active = gates?.value?.G2 !== false;
  const mayEmail = issue.status === "approved" || (issue.status === "fact_checked" && !g2Active);
  if (issue.status !== "published") {
    await sql`update public.guide_issues set status = 'published', published_at = coalesce(published_at, now()) where id = ${issue.id}`;
  }
  if (!mayEmail) return { summary: `${slug}: page published; email skipped (${issue.status === "published" ? "already published" : "G2 tap missing"})`, slug };
  if (!send) return { summary: `${slug}: page published; email not configured (RESEND_API_KEY, EMAIL_FROM, RESEND_GUIDE_SEGMENT_ID)`, slug };
  if (issue.resend_broadcast_id) return { summary: `${slug}: broadcast ${issue.resend_broadcast_id} already created`, slug };

  const id = await send({ subject: issue.title_nl ?? `Webshopgids ${slug}`, html: emailHtml(issue), name: `gids ${slug}` });
  await sql`update public.guide_issues set resend_broadcast_id = ${id}, status = 'sent', sent_at = now() where id = ${issue.id}`;
  return { summary: `${slug}: page published and email sent (broadcast ${id})`, slug };
}

async function main() {
  const now = new Date();
  const forced = process.env.GUIDE_SLOT;
  const slot = forced === "fallback" || forced === "send" ? forced : slotFor(now);
  if (!slot) {
    console.log("not 10:00 on Wednesday or Thursday in Amsterdam, exiting");
    return;
  }
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "guide-publish", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await runGuidePublish(sql, slot, now, resendBroadcaster());
      console.log(r.summary);
      if (r.slug) await revalidateGuide(r.slug);
      return { summary: r.summary };
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("publish.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
