// Nightly pipeline (plan v3 section 8, step 10), started by .github/workflows/pipeline.yml.
// Two UTC crons fire; the run exits unless it is 01:00 in Amsterdam (or FORCE_RUN=1).
// Order: promote accepted candidates, collect ended score batches, crawl, domain age,
// submit a new score batch, then publish due shops and send pre-notices. Every step is its own agent_runs row and is idempotent.
// Ends with a health_checks row so /api/health and the uptime monitor see the result.
import Anthropic from "@anthropic-ai/sdk";
import { connect, runAgentJob, type RunStatus, type Sql } from "../../agents/shared/audit";
import { runCrawl } from "./crawl/run-crawl";
import { runDomainAge } from "./domain-age-step";
import { promoteCandidates } from "./promote-candidates";
import { runPublish } from "./publish/publish";
import { collectBatches, submitIfIdle } from "./score/run-scoring";

export function amsterdamHour(now: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", hourCycle: "h23" }).format(now));
}

type Step = { agent: string; spendsTokens: boolean; work: () => Promise<{ summary?: string }> };

export async function runSteps(sql: Sql, steps: Step[]): Promise<{ agent: string; status: RunStatus | "error" }[]> {
  const results: { agent: string; status: RunStatus | "error" }[] = [];
  for (const s of steps) {
    try {
      const status = await runAgentJob(sql, { agent: s.agent, runsOn: "code", trigger: "pipeline", spendsTokens: s.spendsTokens }, s.work);
      results.push({ agent: s.agent, status });
    } catch (err) {
      console.error(`${s.agent} failed:`, err);
      results.push({ agent: s.agent, status: "error" }); // the agent_runs row already says failed
    }
  }
  await sql`
    insert into public.health_checks ("check", status, detail)
    values ('failed_runs', ${results.every((r) => r.status === "ok") ? "ok" : "fail"},
            ${sql.json({ source: "nightly", steps: results })})`;
  return results;
}

/** Fails the step (and so the health row) when a batch was under the 80% quote match rate. */
export async function collectStep(sql: Sql, client: Parameters<typeof collectBatches>[1]) {
  const { notes, failed } = await collectBatches(sql, client);
  const summary = notes.join(" | ") || "no open batch";
  if (failed) throw new Error(summary);
  return { summary };
}

async function main() {
  if (process.env.FORCE_RUN !== "1" && amsterdamHour(new Date()) !== 1) {
    console.log("not 01:00 in Amsterdam, exiting");
    return;
  }
  const sql = connect();
  const client = new Anthropic();
  try {
    const results = await runSteps(sql, [
      { agent: "promote-candidates", spendsTokens: false, work: () => promoteCandidates(sql) },
      { agent: "score-collect", spendsTokens: false, work: () => collectStep(sql, client) },
      { agent: "crawl", spendsTokens: false, work: () => runCrawl(sql) },
      { agent: "domain-age", spendsTokens: false, work: () => runDomainAge(sql) },
      { agent: "score-submit", spendsTokens: true, work: async () => ({ summary: await submitIfIdle(sql, client) }) },
      { agent: "publish", spendsTokens: false, work: () => runPublish(sql) },
    ]);
    console.log(results.map((r) => `${r.agent}: ${r.status}`).join("\n"));
    if (results.some((r) => r.status === "error" || r.status === "failed")) process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("nightly.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
