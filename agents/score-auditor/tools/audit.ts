// Score Auditor tools (plan v3 section 7, scoring step 7). The routine runs these
// with DATABASE_URL set to the agent_auditor role. It never edits scores.
// Commands:
//   start                          guards, state chain and agent_runs row; prints {"run_id"}
//                                  exit 3 = paused, exit 5 = tonight's score run not ok yet (retry in 1 hour)
//   queue [--limit 20]             shops whose newest score has no audit yet, plus published holdout picks
//   check --run ID --shop ID --maker N --focus N --identity N --scale N --origin N
//         --marketplace true|false --note "rationale"
//                                  writes score_checks; delta over 20 or a marketplace disagreement escalates
//   keurmerk-queue                 shops with keurmerk_status 'unverified' and their certificate page text
//   keurmerk --shop ID --status verified|unverified --method "what the certificate text shows"
//   drift                          mean score of the last 7 days against the 4 weeks before
//   escalate --run ID --kind K --title T --body B
//   finish --run ID --status ok|failed --summary S      (adds the run's MAE to the summary)
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { agePoints, yearsOnline } from "../../../lib/scoring/compute";
import { KEURMERK_FLOOR, MAX_POINTS, PATTERN_TOTAL_CAP } from "../../../lib/scoring/weights";

const AGENT = "score-auditor";
export const PROMPT_VERSION = "a1";
export const HOLDOUT_PER_WEEK = 10;
const SUB_KEYS = ["maker", "focus", "identity", "scale", "origin"] as const;
type SubKey = (typeof SUB_KEYS)[number];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

/** Verdict rules: within 10 agree, within 20 review, else escalate; any marketplace disagreement escalates. */
export function verdictFor(delta: number, marketplaceDisagrees: boolean): "agree" | "review" | "escalate" {
  if (marketplaceDisagrees || Math.abs(delta) > 20) return "escalate";
  return Math.abs(delta) <= 10 ? "agree" : "review";
}

/** The auditor's total from its own sub-scores, with the same cap and floor as lib/scoring. */
export function auditorTotal(sub: Record<SubKey, number>, marketplace: boolean, keurmerkVerified: boolean): number {
  let total = SUB_KEYS.reduce((s, k) => s + sub[k], 0);
  if (marketplace) total = Math.min(total, PATTERN_TOTAL_CAP);
  else if (keurmerkVerified) total = Math.max(total, KEURMERK_FLOOR);
  return Math.max(1, Math.min(100, total));
}

async function latestScore(sql: Sql, shopId: string) {
  const [s] = await sql<{ id: string; total: number; sub_scores: Record<string, unknown>; created_at: Date }[]>`
    select id, total, sub_scores, created_at from public.scores where shop_id = ${shopId} order by created_at desc limit 1`;
  return s;
}

async function pipelineSaysMarketplace(sql: Sql, shopId: string): Promise<boolean> {
  const [r] = await sql<{ v: boolean }[]>`
    select coalesce(bool_or(value_bool and quote_verified), false) as v from public.shop_signals
    where shop_id = ${shopId} and source = 'llm' and signal_key in ('marketplace_pattern', 'dropship_indicators')
      and run_id = (select run_id from public.shop_signals where shop_id = ${shopId} and source = 'llm' order by created_at desc limit 1)`;
  return r?.v ?? false;
}

async function main() {
  const cmd = process.argv[2];
  const sql = connect();
  try {
    switch (cmd) {
      case "start": {
        const guard = await checkKillSwitch(sql, AGENT);
        if (!guard.ok) {
          console.log(JSON.stringify({ paused: true, reason: guard.reason }));
          process.exitCode = 3;
          return;
        }
        // State chain (plan section 8, step 10): run only after tonight's scoring step is ok.
        const [last] = await sql<{ status: string; started_at: Date }[]>`
          select status, started_at from public.score_runs order by started_at desc limit 1`;
        if (!last || last.status !== "ok" || Date.now() - last.started_at.getTime() > 36 * 3600 * 1000) {
          console.log(JSON.stringify({ ready: false, reason: "no ok score run in the last 36 hours" }));
          process.exitCode = 5;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule" });
        console.log(JSON.stringify({ run_id: id, prompt_version: PROMPT_VERSION }));
        return;
      }
      case "queue": {
        const limit = Math.min(Number(arg("limit") ?? 20), 60);
        const shops = await sql<{ id: string; name: string; domain: string; status: string; product_count_est: number | null; keurmerk_status: string; holdout: boolean }[]>`
          with latest as (
            select distinct on (shop_id) shop_id, created_at from public.scores order by shop_id, created_at desc
          ),
          unaudited as (
            select s.id, false as holdout from public.shops s join latest l on l.shop_id = s.id
            where s.status in ('draft', 'prenotified', 'hidden')
              and not exists (select 1 from public.score_checks c where c.shop_id = s.id and c.checked_at > l.created_at)
          ),
          holdout as (
            select s.id, true as holdout from public.shops s
            where s.status = 'published'
              and (select count(*) from public.score_checks c where c.holdout and c.checked_at > now() - interval '7 days') < ${HOLDOUT_PER_WEEK}
              and not exists (select 1 from public.score_checks c where c.shop_id = s.id and c.checked_at > now() - interval '28 days')
            order by random() limit ${HOLDOUT_PER_WEEK}
          )
          select s.id, s.name, s.domain, s.status, s.product_count_est, s.keurmerk_status, q.holdout
          from (select * from unaudited union all select * from holdout) q join public.shops s on s.id = q.id
          limit ${limit}`;
        for (const s of shops) {
          const pages = await sql<{ url: string; page_type: string; text_excerpt: string | null }[]>`
            select url, page_type, text_excerpt from public.crawl_pages
            where shop_id = ${s.id} and text_excerpt is not null order by page_type, url`;
          console.log(`=== shop ${s.id}${s.holdout ? " (holdout)" : ""}`);
          console.log(`facts: product count ${s.product_count_est ?? "unknown"}, keurmerk ${s.keurmerk_status}`);
          console.log(wrapUntrusted(`name: ${s.name}\ndomain: ${s.domain}\n\n` + pages.map((p) => `--- ${p.page_type}: ${p.url}\n${p.text_excerpt}`).join("\n\n")));
        }
        if (shops.length === 0) console.log("queue empty");
        return;
      }
      case "check": {
        const runId = need("run");
        const shopId = need("shop");
        const sub = {} as Record<SubKey, number>;
        for (const k of SUB_KEYS) {
          const v = Number(need(k));
          if (!Number.isInteger(v) || v < 0 || v > MAX_POINTS[k]) throw new Error(`--${k} must be an integer 0 to ${MAX_POINTS[k]}`);
          sub[k] = v;
        }
        const mp = need("marketplace");
        if (mp !== "true" && mp !== "false") throw new Error("--marketplace must be true or false");
        const note = need("note").slice(0, 2000);
        const score = await latestScore(sql, shopId);
        if (!score) throw new Error("shop has no score");
        const [shop] = await sql<{ status: string; keurmerk_status: string; domain_first_seen: Date | null }[]>`
          select status, keurmerk_status, domain_first_seen from public.shops where id = ${shopId}`;
        // Time online is a measured fact, as in the pipeline: the tool adds it, not the auditor.
        sub.identity = Math.min(MAX_POINTS.identity, sub.identity + agePoints(yearsOnline(shop.domain_first_seen)));
        const total = auditorTotal(sub, mp === "true", shop.keurmerk_status === "verified");
        const delta = total - score.total;
        const pipelineMp = await pipelineSaysMarketplace(sql, shopId);
        const verdict = verdictFor(delta, pipelineMp !== (mp === "true"));
        await sql`
          insert into public.score_checks (shop_id, checker, checker_model, checker_prompt_version, check_total, sub_scores, delta, holdout, verdict, note)
          values (${shopId}, 'auditor', ${process.env.AUDITOR_MODEL ?? "routine"}, ${PROMPT_VERSION}, ${total},
                  ${sql.json({ ...sub, marketplace: mp === "true" })}, ${delta}, ${shop.status === "published"}, ${verdict}, ${note})`;
        if (verdict === "escalate") {
          await sql`
            insert into public.agent_escalations (agent, kind, title, body_md, label, agent_run_id)
            values (${AGENT}, 'score_disagreement', ${`Score disagreement for shop ${shopId}: pipeline ${score.total}, auditor ${total}`},
                    ${`Pipeline score ${score.total} (sub-scores ${JSON.stringify(score.sub_scores)}, marketplace ${pipelineMp}).\n\nAuditor score ${total} (sub-scores ${JSON.stringify(sub)}, marketplace ${mp}).\n\nAuditor rationale:\n\n${note}`},
                    'agent-proposed', ${runId})`;
        }
        console.log(JSON.stringify({ ok: true, pipeline_total: score.total, auditor_total: total, delta, verdict }));
        return;
      }
      case "keurmerk-queue": {
        const rows = await sql<{ id: string; domain: string; keurmerk: string[]; url: string; text_excerpt: string | null }[]>`
          select s.id, s.domain, s.keurmerk, c.url, c.text_excerpt from public.shops s
          join public.crawl_pages c on c.shop_id = s.id and c.page_type = 'keurmerk_certificate'
          where s.keurmerk_status = 'unverified' and s.status in ('draft', 'hidden') order by s.id limit 30`;
        for (const r of rows) console.log(`=== shop ${r.id} (${r.domain}) claims ${r.keurmerk.join(", ")}\n${wrapUntrusted(`${r.url}\n${r.text_excerpt ?? "(no text)"}`)}`);
        if (rows.length === 0) console.log("queue empty");
        return;
      }
      case "keurmerk": {
        const status = need("status");
        if (status !== "verified" && status !== "unverified") throw new Error("--status must be verified or unverified");
        const rows = await sql`
          update public.shops set keurmerk_status = ${status}, keurmerk_verified_method = ${`auditor: ${need("method").slice(0, 200)}`}
          where id = ${need("shop")} and keurmerk_status = 'unverified' returning id`;
        console.log(JSON.stringify({ ok: rows.length === 1 }));
        return;
      }
      case "drift": {
        const [d] = await sql<{ recent: number | null; previous: number | null; n_recent: number }[]>`
          select avg(total) filter (where created_at > now() - interval '7 days')::float as recent,
                 avg(total) filter (where created_at <= now() - interval '7 days' and created_at > now() - interval '35 days')::float as previous,
                 count(*) filter (where created_at > now() - interval '7 days')::int as n_recent
          from public.scores`;
        const diff = d.recent != null && d.previous != null ? Math.round((d.recent - d.previous) * 10) / 10 : null;
        console.log(JSON.stringify({ ...d, diff, flag: diff != null && Math.abs(diff) > 5 }));
        return;
      }
      case "escalate": {
        await sql`
          insert into public.agent_escalations (agent, kind, title, body_md, label, agent_run_id)
          values (${AGENT}, ${need("kind").slice(0, 60)}, ${need("title").slice(0, 200)}, ${need("body").slice(0, 8000)}, 'agent-proposed', ${need("run")})`;
        console.log(JSON.stringify({ ok: true }));
        return;
      }
      case "finish": {
        const status = need("status");
        if (status !== "ok" && status !== "failed") throw new Error("status must be ok or failed");
        const runId = need("run");
        const [run] = await sql<{ started_at: Date }[]>`select started_at from public.agent_runs where id = ${runId}`;
        const [m] = await sql<{ mae: number | null; n: number }[]>`
          select avg(abs(delta))::float as mae, count(*)::int as n from public.score_checks
          where checker = 'auditor' and checked_at >= ${run.started_at}`;
        const mae = m.mae == null ? "n/a" : (Math.round(m.mae * 10) / 10).toString();
        await finishAgentRun(sql, runId, { status, summary: `audits ${m.n}, MAE ${mae}. ${need("summary")}`.slice(0, 2000) });
        console.log(JSON.stringify({ ok: true, audits: m.n, mae }));
        return;
      }
      default:
        throw new Error("usage: audit.ts start|queue|check|keurmerk-queue|keurmerk|drift|escalate|finish");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("audit.ts")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  });
}
