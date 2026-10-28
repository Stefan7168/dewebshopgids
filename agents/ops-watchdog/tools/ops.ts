// Ops Watchdog tool (plan v3 section 4 and section 8, steps 15 and 16).
// Runs as the `agent_ops` role. Commands:
//   start                          exit 3 paused; exit 4 nothing to do (no failed check, not digest time);
//                                  otherwise prints run_id and whether the digest summary is due
//   status                         failed checks and runs of the last 24 hours, spend, current pauses
//   pause --run ID --agent A --reason R   enabled.A = false for 48 hours, alert email to the owner at once
//   summary --run ID --text T      the weekly digest summary (Sunday run only)
//   escalate --run ID --kind K --title T --body B
//   finish --run ID --status ok|failed --summary S
// The Watchdog can pause but never unpause. Code (health.ts) lifts a pause after 48 hours if checks are green.
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, writeAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";

const AGENT = "ops-watchdog";
export const PAUSE_HOURS = 48;
const LOOKBACK = "7 hours"; // the routine runs every 6 hours

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

/** The Sunday 17:30 run writes the digest summary; the digest is assembled at 18:00. */
export function digestDue(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return get("weekday") === "Sun" && get("hour") === "17";
}

async function pausable(sql: Sql, agent: string): Promise<boolean> {
  if (agent === AGENT) return false;
  const [row] = await sql`select 1 from public.agent_schedule where agent = ${agent}`;
  return Boolean(row);
}

async function main() {
  const cmd = process.argv[2];
  const sql = connect();
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
        const [{ n }] = await sql<{ n: number }[]>`
          select count(*)::int as n from public.health_checks
          where status = 'fail' and checked_at > now() - ${LOOKBACK}::interval`;
        const digest = digestDue(new Date());
        if (n === 0 && !digest) {
          // Still one run row, so the schedule gap check sees the Watchdog is alive.
          await writeAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", status: "ok", summary: "no failed checks" });
          console.log(JSON.stringify({ work: false }));
          process.exitCode = 4;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule" });
        console.log(JSON.stringify({ run_id: id, failed_checks: n, digest_summary_due: digest }));
        return;
      }
      case "status": {
        const checks = await sql`
          select "check", status, detail, checked_at from public.health_checks
          where status <> 'ok' and checked_at > now() - interval '24 hours' order by checked_at desc limit 50`;
        const runs = await sql<{ agent: string; status: string; started_at: Date; error: string | null; summary: string | null }[]>`
          select agent, status, started_at, left(error, 500) as error, left(summary, 300) as summary from public.agent_runs
          where status in ('failed', 'over_budget') and started_at > now() - interval '24 hours' order by started_at desc limit 30`;
        const settings = await sql`
          select key, value from public.agent_settings
          where key in ('agents_enabled', 'monthly_budget_usd', 'month_spend_usd') or key like 'enabled.%' or key like 'paused_until.%'`;
        console.log(JSON.stringify({ checks, settings }, null, 1));
        // Error texts can carry scraped content (for example a fetch error with page text).
        console.log(wrapUntrusted(runs.map((r) => `${r.started_at.toISOString()} ${r.agent} ${r.status}: ${r.error ?? r.summary ?? ""}`).join("\n") || "no failed runs"));
        return;
      }
      case "pause": {
        const runId = need("run");
        const agent = need("agent");
        if (!(await pausable(sql, agent))) throw new Error(`cannot pause ${agent}: not in agent_schedule, or it is the Watchdog`);
        const reason = need("reason").slice(0, 500);
        const until = new Date(Date.now() + PAUSE_HOURS * 3600 * 1000).toISOString();
        await sql.begin(async (tx) => {
          for (const [key, value] of [[`enabled.${agent}`, false], [`paused_until.${agent}`, until]] as const) {
            await tx`
              insert into public.agent_settings (key, value) values (${key}, ${tx.json(value)})
              on conflict (key) do update set value = excluded.value`;
          }
          await tx`
            insert into public.email_queue ("to", template, slots, priority)
            values ('owner', 'ops_pause_alert', ${tx.json({ agent, reason, paused_until: until, run_id: runId })}, 1)`;
        });
        console.log(JSON.stringify({ ok: true, agent, paused_until: until }));
        return;
      }
      case "summary": {
        await sql`
          insert into public.email_queue ("to", template, slots, priority)
          values ('owner', 'digest_summary', ${sql.json({ text: need("text").slice(0, 3000), run_id: need("run") })}, 9)`;
        console.log(JSON.stringify({ ok: true }));
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
        await finishAgentRun(sql, need("run"), { status, summary: need("summary").slice(0, 2000) });
        console.log(JSON.stringify({ ok: true }));
        return;
      }
      default:
        throw new Error("usage: ops.ts start|status|pause|summary|escalate|finish");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("ops.ts")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  });
}
