// Common guards for every agent job and tool (plan section 9).
// Call runAgentJob() as the entry point; it checks the kill switch and budget,
// writes the agent_runs row at start and finishes it at the end.
import postgres from "postgres";
import { decideBudget, decideKillSwitch, type GuardResult, type Settings } from "./guards";

export type Sql = postgres.Sql;
export type RunsOn = "routine" | "action" | "code";
export type RunStatus = "ok" | "failed" | "paused" | "over_budget";

export function connect(url = process.env.DATABASE_URL): Sql {
  if (!url) throw new Error("DATABASE_URL is not set");
  // prepare: false is required by the Supavisor transaction pooler.
  return postgres(url, { prepare: false, max: 1, idle_timeout: 5 });
}

async function readSettings(sql: Sql, agent: string): Promise<Settings> {
  const rows = await sql<{ key: string; value: unknown }[]>`
    select key, value from public.agent_settings
    where key in ('agents_enabled', 'monthly_budget_usd', 'month_spend_usd',
                  ${`enabled.${agent}`}, ${`paused_until.${agent}`})`;
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Soft guard. Advisory only: the hard stop is kill-switch.yml. */
export async function checkKillSwitch(sql: Sql, agent: string): Promise<GuardResult> {
  return decideKillSwitch(await readSettings(sql, agent), agent, new Date(), process.env.AGENTS_PAUSED);
}

export async function budgetGuard(sql: Sql, agent: string): Promise<GuardResult> {
  return decideBudget(await readSettings(sql, agent));
}

export async function startAgentRun(
  sql: Sql,
  run: { agent: string; runsOn: RunsOn; trigger?: string; inputRef?: string },
): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    insert into public.agent_runs (agent, runs_on, trigger, input_ref)
    values (${run.agent}, ${run.runsOn}, ${run.trigger ?? null}, ${run.inputRef ?? null})
    returning id`;
  return row.id;
}

export async function finishAgentRun(
  sql: Sql,
  id: string,
  result: {
    status: RunStatus;
    summary?: string;
    error?: string;
    outputRefs?: unknown[];
    tokensIn?: number;
    tokensOut?: number;
    costUsdEst?: number;
  },
): Promise<void> {
  await sql`
    update public.agent_runs set
      finished_at = now(),
      status = ${result.status},
      summary = ${result.summary ?? null},
      error = ${result.error ?? null},
      output_refs = ${sql.json((result.outputRefs ?? []) as postgres.JSONValue)},
      tokens_in = ${result.tokensIn ?? null},
      tokens_out = ${result.tokensOut ?? null},
      cost_usd_est = ${result.costUsdEst ?? null}
    where id = ${id}`;
}

/** Write a complete agent_runs row for a run that never started its work. */
export async function writeAgentRun(
  sql: Sql,
  run: { agent: string; runsOn: RunsOn; trigger?: string; status: RunStatus; summary?: string },
): Promise<string> {
  const id = await startAgentRun(sql, run);
  await finishAgentRun(sql, id, { status: run.status, summary: run.summary });
  return id;
}

/**
 * Entry point for every job: guards, then the work, then the run row.
 * Returns the run status. Throws nothing for guard stops; rethrows work errors
 * after recording them.
 */
export async function runAgentJob(
  sql: Sql,
  run: { agent: string; runsOn: RunsOn; trigger?: string; inputRef?: string },
  work: (runId: string) => Promise<{ summary?: string; outputRefs?: unknown[] } | void>,
): Promise<RunStatus> {
  const kill = await checkKillSwitch(sql, run.agent);
  if (!kill.ok) {
    await writeAgentRun(sql, { ...run, status: "paused", summary: kill.reason });
    return "paused";
  }
  const budget = await budgetGuard(sql, run.agent);
  if (!budget.ok) {
    await writeAgentRun(sql, { ...run, status: "over_budget", summary: budget.reason });
    return "over_budget";
  }
  const id = await startAgentRun(sql, run);
  try {
    const out = (await work(id)) ?? {};
    await finishAgentRun(sql, id, { status: "ok", ...out });
    return "ok";
  } catch (err) {
    await finishAgentRun(sql, id, { status: "failed", error: String(err) });
    throw err;
  }
}
