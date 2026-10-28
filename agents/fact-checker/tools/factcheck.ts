// Fact Checker tools (plan v3 section 3). The routine runs these with DATABASE_URL set to the
// agent_factcheck role, which may write only fact_check_report, status (fact_checked or
// rejected) and checked_at. It cannot edit the text. Code checks run first and cannot be
// overruled: a draft with a code finding is always rejected.
// Commands:
//   start                              guards and agent_runs row; prints {"run_id", "issue"}
//                                      exit 3 = paused, exit 4 = nothing to check
//   draft --issue SLUG                 the draft, this week's inputs and the code findings
//   verdict --run ID --issue SLUG --pass true|false [--findings-json '["claim X is not in the inputs"]']
//   finish --run ID --status ok|failed --summary S
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, writeAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { checkDraft } from "../../../lib/guide/check";
import type { GuideSnapshot } from "../../../lib/guide/inputs";

const AGENT = "fact-checker";
export const PROMPT_VERSION = "f1";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

type Issue = {
  id: string; slug: string; status: string; drafted_at: Date | null; checked_at: Date | null;
  fact_check_report: { round?: number } | null; inputs_snapshot: GuideSnapshot;
  title_nl: string | null; intro_nl: string | null; body_md: string | null; shop_ids: string[];
};

/** A draft exists and changed after the last check. */
export function needsCheck(i: Pick<Issue, "drafted_at" | "checked_at">): boolean {
  return i.drafted_at !== null && (i.checked_at === null || i.drafted_at > i.checked_at);
}

export function parseFindings(json: string | undefined): string[] {
  if (!json) return [];
  const v = JSON.parse(json) as unknown;
  if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) throw new Error("--findings-json must be an array of strings");
  return v.map((x) => x.slice(0, 300)).slice(0, 20);
}

async function openIssues(sql: Sql) {
  return sql<Issue[]>`
    select i.id, i.slug, i.status, i.drafted_at, i.checked_at, i.fact_check_report, i.inputs_snapshot,
           g.title_nl, g.intro_nl, g.body_md, g.shop_ids
    from public.guide_inputs i join public.guide_issues g on g.id = i.id order by i.slug`;
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
        const due = (await openIssues(sql)).find(needsCheck);
        if (!due) {
          await writeAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", status: "ok", summary: "nothing to check" });
          console.log(JSON.stringify({ work: false }));
          process.exitCode = 4;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", inputRef: due.slug });
        console.log(JSON.stringify({ run_id: id, issue: due.slug, prompt_version: PROMPT_VERSION }));
        return;
      }
      case "draft": {
        const issue = (await openIssues(sql)).find((i) => i.slug === need("issue"));
        if (!issue) throw new Error("issue not open");
        const findings = checkDraft(issue, issue.inputs_snapshot);
        console.log(`code findings (each one rejects the draft): ${findings.length ? "\n- " + findings.join("\n- ") : "none"}`);
        console.log("INPUTS (the only allowed facts):");
        console.log(wrapUntrusted(JSON.stringify(issue.inputs_snapshot, null, 1)));
        console.log("DRAFT (written by the Guide Editor):");
        console.log(wrapUntrusted(`shop_ids: ${issue.shop_ids.join(", ")}\ntitle: ${issue.title_nl ?? ""}\nintro: ${issue.intro_nl ?? ""}\n\n${issue.body_md ?? ""}`));
        return;
      }
      case "verdict": {
        const runId = need("run");
        const issue = (await openIssues(sql)).find((i) => i.slug === need("issue"));
        if (!issue || !needsCheck(issue)) throw new Error("issue is not waiting for a check");
        const pass = need("pass");
        if (pass !== "true" && pass !== "false") throw new Error("--pass must be true or false");
        const agentFindings = parseFindings(arg("findings-json"));
        const codeFindings = checkDraft(issue, issue.inputs_snapshot);
        if (pass === "false" && agentFindings.length === 0) throw new Error("a rejection needs --findings-json");
        const passed = pass === "true" && codeFindings.length === 0 && agentFindings.length === 0;
        const round = (issue.fact_check_report?.round ?? 0) + 1;
        const report = { round, passed, code_findings: codeFindings, agent_findings: agentFindings, prompt_version: PROMPT_VERSION, run_id: runId };
        await sql`
          update public.guide_issues set fact_check_report = ${sql.json(report as never)}, status = ${passed ? "fact_checked" : "rejected"}, checked_at = now()
          where id = ${issue.id} and status in ('draft', 'rejected')`;
        console.log(JSON.stringify({ ok: true, passed, round }));
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
        throw new Error("usage: factcheck.ts start|draft|verdict|finish");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("factcheck.ts")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  });
}
