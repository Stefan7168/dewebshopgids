// SEO/Growth Analyst tools (plan v3 section 3). The routine runs these with DATABASE_URL set to
// the agent_analyst role: read-only, plus agent_escalations. It never changes the site.
// Commands:
//   start                          guards and agent_runs row; prints {"run_id", "forecast_due"}; exit 3 = paused
//   report                         this week against last week: search, clicks, shops, AI citations
//   escalate --run ID --kind K --title T --body B [--needs-human]
//                                  max 5 per run (the plan's weekly cap; the routine runs weekly)
//   finish --run ID --status ok|failed --summary S
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, writeAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { MIN_SHOPS_PER_LIST, TOPICS } from "../../../lib/beste/topics";

const AGENT = "seo-growth-analyst";
export const MAX_ESCALATIONS_PER_RUN = 5;
export const KINDS = ["indexation", "thin_page", "ctr_change", "ai_citations", "forecast", "topic_proposal", "other"] as const;
// North star (plan v3): EUR 150 approved commission per month by week 52.
export const NORTH_STAR_EUR = 150;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

/** The monthly forecast is due on the first Monday of the month (Amsterdam date). */
export function forecastDue(now: Date): boolean {
  const day = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", day: "numeric" }).format(now));
  return day <= 7;
}

/** Relative change, rounded to whole percent; null when there is no base. */
export function change(now: number, before: number): number | null {
  return before === 0 ? null : Math.round(((now - before) / before) * 100);
}

async function main() {
  const cmd = process.argv[2];
  const sql: Sql = connect();
  try {
    switch (cmd) {
      case "start": {
        const guard = await checkKillSwitch(sql, AGENT);
        if (!guard.ok) {
          await writeAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", status: "paused", summary: guard.reason });
          console.log(JSON.stringify({ paused: true, reason: guard.reason }));
          process.exitCode = 3;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule" });
        console.log(JSON.stringify({ run_id: id, forecast_due: forecastDue(new Date()) }));
        return;
      }
      case "report": {
        const [gsc] = await sql<{ imp_now: number; imp_before: number; clk_now: number; clk_before: number; pages_now: number; latest: string | null }[]>`
          select coalesce(sum(impressions) filter (where date > current_date - 9), 0)::int as imp_now,
                 coalesce(sum(impressions) filter (where date <= current_date - 9 and date > current_date - 16), 0)::int as imp_before,
                 coalesce(sum(clicks) filter (where date > current_date - 9), 0)::int as clk_now,
                 coalesce(sum(clicks) filter (where date <= current_date - 9 and date > current_date - 16), 0)::int as clk_before,
                 count(distinct page) filter (where date > current_date - 30 and impressions > 0)::int as pages_now,
                 max(date)::text as latest
          from public.search_console_daily`;
        const [shops] = await sql<{ published: number; prenotified: number; draft: number }[]>`
          select count(*) filter (where status in ('published', 'disputed'))::int as published,
                 count(*) filter (where status = 'prenotified')::int as prenotified,
                 count(*) filter (where status = 'draft')::int as draft
          from public.shops`;
        const [clicks] = await sql<{ now: number; before: number; month: number }[]>`
          select count(*) filter (where occurred_at > now() - interval '7 days')::int as now,
                 count(*) filter (where occurred_at <= now() - interval '7 days' and occurred_at > now() - interval '14 days')::int as before,
                 count(*) filter (where occurred_at > date_trunc('month', now()))::int as month
          from public.clicks where device <> 'bot'`;
        const [money] = await sql<{ approved_month: number; pending: number }[]>`
          select coalesce(sum(amount_eur) filter (where status in ('approved', 'paid') and reported_at > date_trunc('month', now())), 0)::float as approved_month,
                 coalesce(sum(amount_eur) filter (where status = 'pending'), 0)::float as pending
          from public.commissions`;
        const topQueries = await sql<{ query: string; impressions: number; clicks: number; position: number }[]>`
          select query, sum(impressions)::int as impressions, sum(clicks)::int as clicks, round(avg(position), 1)::float as position
          from public.search_console_daily where date > current_date - 9 and query <> ''
          group by query order by impressions desc limit 15`;
        const perCategory = await sql<{ slug: string; n: number }[]>`
          select c.slug, count(s.id)::int as n from public.categories c
          left join public.categories sub on sub.parent_id = c.id or sub.id = c.id
          left join public.shops s on s.category_id = sub.id and s.status = 'published' and s.score is not null and s.score_label is null
          group by c.slug order by n desc`;
        // Until migration 0010 is applied the table does not exist; report that instead of failing.
        const citations = await sql<{ checked_on: string; cited: number; found: number; total: number }[]>`
          select checked_on::text, count(*) filter (where cited)::int as cited, count(*) filter (where found)::int as found, count(*)::int as total
          from public.ai_citation_checks group by checked_on order by checked_on desc limit 2`.catch(() => "not available yet");
        console.log(JSON.stringify({
          search_console: { ...gsc, impressions_change_pct: change(gsc.imp_now, gsc.imp_before), clicks_change_pct: change(gsc.clk_now, gsc.clk_before) },
          shops,
          outbound_clicks: { ...clicks, change_pct: change(clicks.now, clicks.before) },
          commissions: { ...money, north_star_eur: NORTH_STAR_EUR },
          beste_topics: TOPICS.map((t) => ({ slug: t.slug, category: t.categorySlug, min_shops: MIN_SHOPS_PER_LIST })),
          scored_published_per_category: perCategory,
          ai_citations_last_two_months: citations,
        }, null, 2));
        // Search queries are typed by strangers: data only.
        console.log(wrapUntrusted(topQueries.map((q) => `${q.impressions} impressions, ${q.clicks} clicks, position ${q.position}: ${q.query}`).join("\n") || "(no queries yet)"));
        return;
      }
      case "escalate": {
        const runId = need("run");
        const kind = need("kind");
        if (!(KINDS as readonly string[]).includes(kind)) throw new Error(`--kind must be one of ${KINDS.join(", ")}`);
        const [{ n }] = await sql<{ n: number }[]>`
          select coalesce(jsonb_array_length(output_refs), 0)::int as n from public.agent_runs where id = ${runId}`;
        if (n >= MAX_ESCALATIONS_PER_RUN) throw new Error(`limit of ${MAX_ESCALATIONS_PER_RUN} escalations per run reached`);
        await sql`
          insert into public.agent_escalations (agent, kind, title, body_md, label, agent_run_id)
          values (${AGENT}, ${kind}, ${need("title").slice(0, 200)}, ${need("body").slice(0, 8000)},
                  ${process.argv.includes("--needs-human") ? "needs-human" : "agent-proposed"}, ${runId})`;
        await sql`update public.agent_runs set output_refs = coalesce(output_refs, '[]'::jsonb) || ${sql.json([{ escalation: kind }])} where id = ${runId}`;
        console.log(JSON.stringify({ ok: true, used: n + 1, max: MAX_ESCALATIONS_PER_RUN }));
        return;
      }
      case "finish": {
        const status = need("status");
        if (status !== "ok" && status !== "failed") throw new Error("status must be ok or failed");
        const runId = need("run");
        const [run] = await sql<{ output_refs: unknown[] | null }[]>`select output_refs from public.agent_runs where id = ${runId}`;
        await finishAgentRun(sql, runId, { status, summary: need("summary").slice(0, 2000), outputRefs: run?.output_refs ?? [] });
        console.log(JSON.stringify({ ok: true }));
        return;
      }
      default:
        throw new Error("usage: analyst.ts start|report|escalate|finish");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("analyst.ts")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  });
}
