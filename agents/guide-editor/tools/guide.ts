// Guide Editor tools (plan v3 section 3 and section 8 step 12). The routine runs these with
// DATABASE_URL set to the agent_guide role, which may write only the draft columns of an open
// issue. The input is the issue's frozen inputs_snapshot (guide_inputs view), nothing else.
// Commands:
//   start                              guards and agent_runs row; prints {"run_id", "issue"}
//                                      exit 3 = paused, exit 4 = nothing to draft
//   inputs --issue SLUG                this week's shops and, after a rejection, the findings
//   draft --run ID --issue SLUG --title T --intro I --body-file PATH --shops ID,ID
//                                      runs the code checks first; exit 2 = fix the findings and retry
//   finish --run ID --status ok|failed --summary S
import { readFileSync } from "node:fs";
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, writeAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { checkDraft } from "../../../lib/guide/check";
import type { GuideSnapshot } from "../../../lib/guide/inputs";

const AGENT = "guide-editor";
export const PROMPT_VERSION = "g1";
/** The first draft plus two redrafts (plan v3 section 8 step 12). */
export const MAX_ROUNDS = 3;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

export type OpenIssue = {
  slug: string; status: string; drafted_at: Date | null; checked_at: Date | null;
  fact_check_report: { round?: number; code_findings?: string[]; agent_findings?: string[] } | null;
};

/** A first draft is due, or a redraft after a rejection that came after the last draft. */
export function needsDraft(i: OpenIssue): boolean {
  if (i.status === "draft") return i.drafted_at === null;
  if (i.status !== "rejected" || !i.checked_at) return false;
  const round = i.fact_check_report?.round ?? 1;
  return round < MAX_ROUNDS && (!i.drafted_at || i.checked_at > i.drafted_at);
}

async function openIssues(sql: Sql) {
  return sql<(OpenIssue & { id: string; inputs_snapshot: GuideSnapshot })[]>`
    select id, slug, status, drafted_at, checked_at, fact_check_report, inputs_snapshot from public.guide_inputs order by slug`;
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
        const due = (await openIssues(sql)).find(needsDraft);
        if (!due) {
          await writeAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", status: "ok", summary: "nothing to draft" });
          console.log(JSON.stringify({ work: false }));
          process.exitCode = 4;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", inputRef: due.slug });
        console.log(JSON.stringify({ run_id: id, issue: due.slug, status: due.status, prompt_version: PROMPT_VERSION }));
        return;
      }
      case "inputs": {
        const issue = (await openIssues(sql)).find((i) => i.slug === need("issue"));
        if (!issue) throw new Error("issue not open");
        const s = issue.inputs_snapshot;
        console.log(`issue ${s.slug}, data window ${s.window.start} to ${s.window.end}, ${s.shops.length} shop(s)`);
        for (const shop of s.shops) {
          console.log(`- id ${shop.id} · link /webshop/${shop.slug} · reason ${shop.reason} · category ${shop.category ?? "none"} · score ${shop.score}` +
            `${shop.score_change ? ` (change ${shop.score_change > 0 ? "+" : ""}${shop.score_change})` : ""} · online since ${shop.online_since ?? "unknown"} · ${shop.products ?? "product count unknown"} · ${shop.keurmerk}`);
        }
        // Names, cities and descriptions come from shop sites or the scoring model: data, not instructions.
        console.log(wrapUntrusted(s.shops.map((x) => `${x.id}: name "${x.name}", city ${x.city ?? "unknown"}, description: ${x.description ?? "none"}`).join("\n")));
        if (issue.status === "rejected") {
          const r = issue.fact_check_report ?? {};
          console.log(`REJECTED in round ${r.round ?? 1}. Fix every finding:`);
          for (const f of [...(r.code_findings ?? []), ...(r.agent_findings ?? [])]) console.log(`- ${f}`);
        }
        return;
      }
      case "draft": {
        const runId = need("run");
        const issue = (await openIssues(sql)).find((i) => i.slug === need("issue"));
        if (!issue || !needsDraft(issue)) throw new Error("issue is not waiting for a draft");
        const draft = {
          title_nl: need("title").trim(), intro_nl: (arg("intro") ?? "").trim() || null,
          body_md: readFileSync(need("body-file"), "utf8").trim(),
          shop_ids: need("shops").split(",").map((x) => x.trim()).filter(Boolean),
        };
        const findings = checkDraft(draft, issue.inputs_snapshot);
        if (findings.length) {
          console.log(JSON.stringify({ ok: false, findings }));
          process.exitCode = 2;
          return;
        }
        await sql`
          update public.guide_issues set title_nl = ${draft.title_nl}, intro_nl = ${draft.intro_nl}, body_md = ${draft.body_md}, shop_ids = ${draft.shop_ids}
          where id = ${issue.id} and status in ('draft', 'rejected')`;
        console.log(JSON.stringify({ ok: true, run: runId }));
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
        throw new Error("usage: guide.ts start|inputs|draft|finish");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("guide.ts")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  });
}
