// SEO/Growth Analyst tools (plan v3 section 3). The routine runs these with DATABASE_URL set to
// the agent_analyst role: read-only, plus agent_escalations. It never changes the site.
// Commands:
//   start                          guards and agent_runs row; prints {"run_id", "forecast_due"}; exit 3 = paused
//   report                         this week against last week: search, clicks, shops, AI citations
//   escalate --run ID --kind K --title T --body B [--needs-human]
//                                  max 5 per run (the plan's weekly cap; the routine runs weekly)
//   pin-candidates                 our pages worth a pin, and the paths pinned in the last 90 days
//   pin --run ID --path P --title T --description D --board B
//                                  one Pinterest pin draft; max 10 per run; Stefan approves in /admin/pins (G3)
//   finish --run ID --status ok|failed --summary S
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, writeAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { MIN_SHOPS_PER_LIST, TOPICS } from "../../../lib/beste/topics";

const AGENT = "seo-growth-analyst";
export const MAX_ESCALATIONS_PER_RUN = 5;
export const KINDS = ["indexation", "thin_page", "ctr_change", "ai_citations", "forecast", "topic_proposal", "other"] as const;
export const MAX_PINS_PER_RUN = 10;
export const PIN_BOARDS = ["wonen", "tuin", "eten", "sieraden", "gids"] as const;
const PIN_PATH = /^\/(webshop|beste|gids|categorie)\/[a-z0-9-]{1,80}$/;
// CLAUDE.md voice rules, plus "korting" and "advertentie" as in the gids checks.
const PIN_BANNED = /onbetrouwbaar|review|korting|advertentie|https?:\/\/|www\./i;

/** Why a pin draft is not allowed, or null. Mirrors the 0018 table checks so the agent gets a clear error. */
export function pinProblem(p: { path: string; title: string; description: string; board: string }): string | null {
  if (!PIN_PATH.test(p.path)) return "path must be one of our pages: /webshop/, /beste/, /gids/ or /categorie/ plus a slug";
  if (!(PIN_BOARDS as readonly string[]).includes(p.board)) return `board must be one of ${PIN_BOARDS.join(", ")}`;
  if (p.title.length < 5 || p.title.length > 100) return "title must be 5 to 100 characters";
  if (p.description.length < 20 || p.description.length > 500) return "description must be 20 to 500 characters";
  if (PIN_BANNED.test(`${p.title} ${p.description}`)) return "title or description has a banned word or a URL";
  return null;
}

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
      case "pin-candidates": {
        const shops = await sql<{ slug: string; name: string; score: number; category: string; root: string | null; description_nl: string | null }[]>`
          select s.slug, s.name, s.score, c.slug as category, p.slug as root, s.description_nl
          from public.shops s join public.categories c on c.id = s.category_id left join public.categories p on p.id = c.parent_id
          where s.status = 'published' and s.score is not null and s.score_label is null
          order by s.score desc limit 40`;
        const guides = await sql<{ slug: string; title_nl: string | null }[]>`
          select slug, title_nl from public.guide_issues where status in ('published', 'sent') order by iso_year desc, iso_week desc limit 4`.catch(() => []);
        const scored = await sql<{ slug: string; n: number }[]>`
          select c.slug, count(s.id)::int as n from public.categories c
          left join public.categories sub on sub.parent_id = c.id or sub.id = c.id
          left join public.shops s on s.category_id = sub.id and s.status = 'published' and s.score is not null and s.score_label is null
          group by c.slug`;
        const recent = await sql<{ target_path: string; status: string }[]>`
          select target_path, status from public.pin_drafts where created_at > now() - interval '90 days'`;
        console.log(JSON.stringify({
          boards: PIN_BOARDS, max_per_run: MAX_PINS_PER_RUN,
          pinned_last_90_days: recent,
          // Only lists whose page exists (15+ scored shops); filtered lists are left out, their count is unknown here.
          beste_topics: TOPICS.filter((t) => !t.only && (scored.find((c) => c.slug === t.categorySlug)?.n ?? 0) >= MIN_SHOPS_PER_LIST)
            .map((t) => ({ path: `/beste/webshops-${t.slug}`, title: t.title, category: t.categorySlug })),
          guides: guides.map((g) => ({ path: `/gids/${g.slug}`, title: g.title_nl })),
        }, null, 2));
        // Shop names and descriptions come from crawled sites: data only.
        console.log(wrapUntrusted(shops.map((x) => `/webshop/${x.slug} | ${x.root ?? x.category} | score ${x.score} | ${x.name}: ${x.description_nl ?? ""}`).join("\n") || "(no published shops yet)"));
        return;
      }
      case "pin": {
        const runId = need("run");
        const draft = { path: need("path"), title: need("title").trim(), description: need("description").trim(), board: need("board") };
        const problem = pinProblem(draft);
        if (problem) throw new Error(problem);
        const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from public.pin_drafts where agent_run_id = ${runId}`;
        if (n >= MAX_PINS_PER_RUN) throw new Error(`limit of ${MAX_PINS_PER_RUN} pins per run reached`);
        const [dupe] = await sql`select 1 from public.pin_drafts where target_path = ${draft.path} and created_at > now() - interval '90 days'`;
        if (dupe) throw new Error("this page already has a pin from the last 90 days");
        await sql`
          insert into public.pin_drafts (target_path, title, description, board, agent_run_id)
          values (${draft.path}, ${draft.title}, ${draft.description}, ${draft.board}, ${runId})`;
        console.log(JSON.stringify({ ok: true, used: n + 1, max: MAX_PINS_PER_RUN }));
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
        throw new Error("usage: analyst.ts start|report|escalate|pin-candidates|pin|finish");
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
