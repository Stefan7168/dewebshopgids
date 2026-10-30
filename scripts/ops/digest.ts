// Weekly digest (plan v3 section 8, step 16): Sunday 18:00 Europe/Amsterdam.
// Code assembles it; the Watchdog's Sunday run adds a summary row (email_queue,
// template digest_summary), and the digest says "summary missing" if there is none.
// The digest is queued as one owner email (template weekly_digest); the email sender sends it.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";

export const SUMMARY_MISSING = "summary missing";

export type DigestData = {
  week: string;
  runs: { agent: string; ok: number; failed: number; paused: number; over_budget: number }[];
  gaps: string[];
  spendUsd: number;
  budgetUsd: number;
  escalations: { title: string; url: string | null }[];
  prs: { merged: { number: number; title: string }[]; open: { number: number; title: string }[] } | null;
  gates: unknown;
  pauses: string[];
  watchdogSummary: string | null;
  /** Latest weekly 390 px check (scripts/ops/screenshots.ts); undefined before it first runs. */
  screenshots?: { status: string; problems: string[] } | null;
};

/** ISO week label, for example 2026-W44. */
export function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function sundayAt18(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  return parts.find((p) => p.type === "weekday")?.value === "Sun" && parts.find((p) => p.type === "hour")?.value === "18";
}

/** Plain-text digest body. Dutch headings, numbers only; the Watchdog's text is quoted as is. */
export function renderDigest(d: DigestData): string {
  const lines = [`Weekoverzicht ${d.week}`, ""];
  lines.push("Samenvatting Ops Watchdog:", d.watchdogSummary ?? SUMMARY_MISSING, "");
  lines.push("Agent runs (7 dagen):");
  for (const r of d.runs) lines.push(`- ${r.agent}: ${r.ok} ok, ${r.failed} mislukt, ${r.paused} gepauzeerd, ${r.over_budget} boven budget`);
  if (d.runs.length === 0) lines.push("- geen runs");
  lines.push("", `Schema-gaten: ${d.gaps.length ? d.gaps.join(", ") : "geen"}`);
  lines.push(`Gepauzeerd: ${d.pauses.length ? d.pauses.join(", ") : "niets"}`);
  if (d.screenshots !== undefined)
    lines.push(
      d.screenshots
        ? `Telefooncheck 390 px: ${d.screenshots.status}${d.screenshots.problems.length ? ` (${d.screenshots.problems.join("; ")})` : ""}`
        : "Telefooncheck 390 px: deze week niet gedraaid",
    );
  const pct = d.budgetUsd > 0 ? Math.round((d.spendUsd / d.budgetUsd) * 100) : 0;
  lines.push(`Kosten deze maand: USD ${d.spendUsd.toFixed(2)} van USD ${d.budgetUsd.toFixed(0)} (${pct}%)`, "");
  lines.push("Escalaties deze week:");
  for (const e of d.escalations) lines.push(`- ${e.title}${e.url ? ` (${e.url})` : ""}`);
  if (d.escalations.length === 0) lines.push("- geen");
  lines.push("");
  if (d.prs) {
    lines.push(`PR's gemerged: ${d.prs.merged.map((p) => `#${p.number} ${p.title}`).join("; ") || "geen"}`);
    lines.push(`PR's wachtend: ${d.prs.open.map((p) => `#${p.number} ${p.title}`).join("; ") || "geen"}`);
  } else lines.push("PR's: niet beschikbaar (geen GitHub-token)");
  lines.push("", `Poorten: ${JSON.stringify(d.gates)}`);
  return lines.join("\n");
}

type PrFetcher = () => Promise<DigestData["prs"]>;

export function githubPrs(repo = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN): PrFetcher {
  return async () => {
    if (!repo || !token) return null;
    const res = await fetch(`https://api.github.com/repos/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=50`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const pulls = (await res.json()) as { number: number; title: string; state: string; merged_at: string | null }[];
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      merged: pulls.filter((p) => p.merged_at && Date.parse(p.merged_at) > weekAgo).map(({ number, title }) => ({ number, title })),
      open: pulls.filter((p) => p.state === "open").map(({ number, title }) => ({ number, title })),
    };
  };
}

export async function buildDigest(sql: Sql, prs: PrFetcher, now = new Date()): Promise<{ summary: string }> {
  const week = isoWeek(now);
  const [dup] = await sql`select 1 from public.email_queue where "to" = 'owner' and template = 'weekly_digest' and slots->>'week' = ${week}`;
  if (dup) return { summary: `digest ${week} already queued` };

  const runs = await sql<DigestData["runs"]>`
    select agent,
      count(*) filter (where status = 'ok')::int as ok, count(*) filter (where status = 'failed')::int as failed,
      count(*) filter (where status = 'paused')::int as paused, count(*) filter (where status = 'over_budget')::int as over_budget
    from public.agent_runs where started_at > now() - interval '7 days' group by agent order by agent`;
  const [gap] = await sql<{ detail: { gaps?: { agent: string }[] } }[]>`
    select detail from public.health_checks where "check" = 'schedule_gap' order by checked_at desc limit 1`;
  const [shots] = await sql<{ status: string; detail: { problems?: string[] } }[]>`
    select status, detail from public.health_checks where "check" = 'screenshots' and checked_at > now() - interval '7 days'
    order by checked_at desc limit 1`;
  const settings = await sql<{ key: string; value: unknown }[]>`
    select key, value from public.agent_settings
    where key in ('monthly_budget_usd', 'month_spend_usd', 'gates') or (key like 'enabled.%' and value = 'false'::jsonb)`;
  const get = (k: string) => settings.find((s) => s.key === k)?.value;
  const escalations = await sql<{ title: string; url: string | null }[]>`
    select title, github_issue_url as url from public.agent_escalations where created_at > now() - interval '7 days' order by created_at`;
  // The newest Watchdog summary of the last day; consumed so the email sender does not send it on its own.
  const [summaryRow] = await sql<{ id: string; text: string }[]>`
    select id, slots->>'text' as text from public.email_queue
    where "to" = 'owner' and template = 'digest_summary' and sent_at is null and created_at > now() - interval '24 hours'
    order by created_at desc limit 1`;

  const data: DigestData = {
    week,
    runs,
    gaps: (gap?.detail.gaps ?? []).map((g) => g.agent),
    screenshots: shots ? { status: shots.status, problems: shots.detail.problems ?? [] } : null,
    spendUsd: Number(get("month_spend_usd") ?? 0),
    budgetUsd: Number(get("monthly_budget_usd") ?? 0),
    escalations,
    prs: await prs(),
    gates: get("gates") ?? null,
    pauses: settings.filter((s) => s.key.startsWith("enabled.")).map((s) => s.key.slice("enabled.".length)),
    watchdogSummary: summaryRow?.text ?? null,
  };
  const body = renderDigest(data);
  await sql.begin(async (tx) => {
    await tx`
      insert into public.email_queue ("to", template, slots, priority)
      values ('owner', 'weekly_digest', ${tx.json({ week, body })}, 3)`;
    if (summaryRow) await tx`update public.email_queue set sent_at = now() where id = ${summaryRow.id}`;
  });
  return { summary: `digest ${week} queued${summaryRow ? "" : `, ${SUMMARY_MISSING}`}` };
}

async function main() {
  if (process.env.FORCE_RUN !== "1" && !sundayAt18(new Date())) {
    console.log("not Sunday 18:00 in Amsterdam, exiting");
    return;
  }
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "digest", runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = await buildDigest(sql, githubPrs());
      console.log(r.summary);
      return r;
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("digest.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
