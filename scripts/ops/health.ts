// Code health checks (plan v3 section 8, step 15) and the schedule gap check.
// `health.ts checks` runs every 6 hours from .github/workflows/health.yml;
// `health.ts gaps` runs every 3 hours from .github/workflows/schedule-gaps.yml.
// Both run as the `pipeline` role and write health_checks rows. A gap also
// queues an alert email to the owner (sent later by the email_queue sender),
// because a run that never starts writes no agent_runs row.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";

export type Check = { check: string; status: "ok" | "warn" | "fail"; detail: Record<string, unknown> };
type ScheduleRow = { agent: string; cron: string; timezone: string; max_gap_minutes: number };

/** Code jobs have no agent.json; their schedules live here. */
export const CODE_SCHEDULES: ScheduleRow[] = [
  { agent: "crawl", cron: "0 1 * * *", timezone: "Europe/Amsterdam", max_gap_minutes: 1620 },
  { agent: "score-collect", cron: "0 1 * * *", timezone: "Europe/Amsterdam", max_gap_minutes: 1620 },
  { agent: "health", cron: "15 */6 * * *", timezone: "UTC", max_gap_minutes: 420 },
  { agent: "escalations", cron: "45 */3 * * *", timezone: "UTC", max_gap_minutes: 240 },
  // Runs as the last step of escalations.yml, schedule-gaps.yml and dispute-removals.yml (hourly).
  { agent: "email-sender", cron: "5 * * * *", timezone: "UTC", max_gap_minutes: 120 },
  { agent: "dispute-removals", cron: "5 * * * *", timezone: "UTC", max_gap_minutes: 120 },
  { agent: "dispute-replies", cron: "5 * * * *", timezone: "UTC", max_gap_minutes: 120 },
  { agent: "digest", cron: "0 18 * * 0", timezone: "Europe/Amsterdam", max_gap_minutes: 10140 },
  { agent: "ai-citations", cron: "0 6 2 * *", timezone: "UTC", max_gap_minutes: 46080 }, // 32 days
];

export function readAgentSchedules(agentsDir = join(process.cwd(), "agents")): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  for (const name of readdirSync(agentsDir)) {
    const file = join(agentsDir, name, "agent.json");
    if (!existsSync(file)) continue;
    const cfg = JSON.parse(readFileSync(file, "utf8")) as {
      name: string;
      schedule?: { cron: string; timezone?: string };
      max_gap_minutes?: number;
    };
    if (cfg.schedule && cfg.max_gap_minutes) {
      rows.push({ agent: cfg.name, cron: cfg.schedule.cron, timezone: cfg.schedule.timezone ?? "Europe/Amsterdam", max_gap_minutes: cfg.max_gap_minutes });
    }
  }
  return rows;
}

/** Statuspage.io JSON: indicator none = ok, minor = warn, anything else = fail. */
export function statusFromIndicator(indicator: string | undefined): Check["status"] {
  if (indicator === "none") return "ok";
  if (indicator === "minor") return "warn";
  return "fail";
}

type Fetcher = (url: string) => Promise<Response>;
const timedFetch: Fetcher = (url) => fetch(url, { signal: AbortSignal.timeout(10_000) });

async function statusPage(check: string, url: string, get: Fetcher): Promise<Check> {
  try {
    const res = await get(url);
    const body = (await res.json()) as { status?: { indicator?: string; description?: string } };
    return { check, status: statusFromIndicator(body.status?.indicator), detail: { indicator: body.status?.indicator ?? null, description: body.status?.description ?? null } };
  } catch (err) {
    return { check, status: "warn", detail: { error: String(err) } };
  }
}

export async function runChecks(sql: Sql, get: Fetcher = timedFetch): Promise<Check[]> {
  const checks: Check[] = [];

  // Own /api/health. Unreachable from Actions while Vercel deployment protection is on,
  // so HEALTH_URL is set only once the custom domain is live.
  const healthUrl = process.env.HEALTH_URL;
  if (!healthUrl) checks.push({ check: "health_endpoint", status: "warn", detail: { note: "HEALTH_URL not set" } });
  else {
    try {
      const res = await get(healthUrl);
      checks.push({ check: "health_endpoint", status: res.ok ? "ok" : "fail", detail: { http: res.status } });
    } catch (err) {
      checks.push({ check: "health_endpoint", status: "fail", detail: { error: String(err) } });
    }
  }

  checks.push(await statusPage("vercel_status", "https://www.vercel-status.com/api/v2/status.json", get));
  checks.push(await statusPage("supabase_status", "https://status.supabase.com/api/v2/status.json", get));

  const failed = await sql<{ agent: string; n: number }[]>`
    select agent, count(*)::int as n from public.agent_runs
    where status = 'failed' and started_at > now() - interval '24 hours' group by agent order by agent`;
  checks.push({ check: "failed_runs", status: failed.length ? "fail" : "ok", detail: { failed } });

  const settings = Object.fromEntries(
    (await sql<{ key: string; value: unknown }[]>`
      select key, value from public.agent_settings where key in ('monthly_budget_usd', 'month_spend_usd')`).map((r) => [r.key, Number(r.value)]),
  );
  const share = settings.monthly_budget_usd > 0 ? settings.month_spend_usd / settings.monthly_budget_usd : 0;
  checks.push({
    check: "token_spend",
    status: share >= 1 ? "fail" : share >= 0.8 ? "warn" : "ok",
    detail: { spend_usd: settings.month_spend_usd ?? 0, budget_usd: settings.monthly_budget_usd ?? 0 },
  });

  return checks;
}

async function writeChecks(sql: Sql, checks: Check[]) {
  for (const c of checks) {
    await sql`insert into public.health_checks ("check", status, detail) values (${c.check}, ${c.status}, ${sql.json(c.detail as never)})`;
  }
}

/**
 * A Watchdog pause sets enabled.<agent> = false and paused_until.<agent>. Once paused_until
 * has passed and this run has no failed check, code lifts it (the Watchdog never unpauses).
 * A disable without paused_until is a human decision and stays.
 */
export async function liftExpiredPauses(sql: Sql): Promise<string[]> {
  const rows = await sql<{ agent: string }[]>`
    select substr(p.key, length('paused_until.') + 1) as agent
    from public.agent_settings p
    join public.agent_settings e on e.key = 'enabled.' || substr(p.key, length('paused_until.') + 1)
    where p.key like 'paused_until.%' and jsonb_typeof(p.value) = 'string'
      and (p.value #>> '{}')::timestamptz <= now() and e.value = 'false'::jsonb`;
  for (const { agent } of rows) {
    await sql`update public.agent_settings set value = 'true'::jsonb where key = ${`enabled.${agent}`}`;
    await sql`update public.agent_settings set value = 'null'::jsonb where key = ${`paused_until.${agent}`}`;
  }
  return rows.map((r) => r.agent);
}

export async function runHealth(sql: Sql, get?: Fetcher): Promise<{ summary: string }> {
  const checks = await runChecks(sql, get);
  await writeChecks(sql, checks);
  const lifted = checks.some((c) => c.status === "fail") ? [] : await liftExpiredPauses(sql);
  const summary = checks.map((c) => `${c.check}: ${c.status}`).join(", ");
  return { summary: lifted.length ? `${summary}; pause lifted for ${lifted.join(", ")}` : summary };
}

/** Syncs agent_schedule from each agent.json, then alerts once a day per late agent. */
export async function runGaps(sql: Sql, agentsDir?: string): Promise<{ summary: string }> {
  for (const s of [...readAgentSchedules(agentsDir), ...CODE_SCHEDULES]) {
    await sql`
      insert into public.agent_schedule (agent, cron, timezone, max_gap_minutes)
      values (${s.agent}, ${s.cron}, ${s.timezone}, ${s.max_gap_minutes})
      on conflict (agent) do update set cron = excluded.cron, timezone = excluded.timezone, max_gap_minutes = excluded.max_gap_minutes`;
  }
  const gaps = await sql<{ agent: string; last_run: Date | null; max_gap_minutes: number }[]>`
    select s.agent, max(r.started_at) as last_run, s.max_gap_minutes
    from public.agent_schedule s left join public.agent_runs r on r.agent = s.agent
    group by s.agent, s.max_gap_minutes
    having max(r.started_at) is null or max(r.started_at) < now() - make_interval(mins => s.max_gap_minutes)
    order by s.agent`;
  const late = gaps.map((g) => ({ agent: g.agent, last_run: g.last_run?.toISOString() ?? null }));
  await writeChecks(sql, [{ check: "schedule_gap", status: late.length ? "fail" : "ok", detail: { gaps: late } }]);
  let alerts = 0;
  for (const g of late) {
    const [dup] = await sql`
      select 1 from public.email_queue
      where "to" = 'owner' and template = 'ops_gap_alert' and slots->>'agent' = ${g.agent} and created_at > now() - interval '24 hours'`;
    if (!dup) {
      await sql`
        insert into public.email_queue ("to", template, slots, priority)
        values ('owner', 'ops_gap_alert', ${sql.json({ agent: g.agent, last_run: g.last_run })}, 1)`;
      alerts++;
    }
  }
  return { summary: late.length ? `late: ${late.map((g) => g.agent).join(", ")}; ${alerts} new alerts` : "no gaps" };
}

async function main(mode: string | undefined) {
  if (mode !== "checks" && mode !== "gaps") throw new Error("usage: health.ts checks|gaps");
  const sql = connect();
  try {
    const agent = mode === "checks" ? "health" : "schedule-gaps";
    await runAgentJob(sql, { agent, runsOn: "code", trigger: "schedule", spendsTokens: false }, async () => {
      const r = mode === "checks" ? await runHealth(sql) : await runGaps(sql);
      console.log(r.summary);
      return r;
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("health.ts")) {
  main(process.argv[2]).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
