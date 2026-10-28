// Dispute Handler tools (plan v3 section 7, step 9). The routine runs these with
// DATABASE_URL set to the agent_dispute role. Removal and objection are handled by code;
// this agent checks corrections against stored evidence and picks a reply template.
// It never writes email text, never changes facts or scores, and never sends email.
// Commands:
//   start                          guards and agent_runs row; prints {"run_id"}
//                                  exit 3 = paused, exit 4 = no open disputes (nothing to do)
//   queue [--limit 10]             open correction and prenotice disputes with the shop's facts and evidence
//   no-change --run ID --dispute ID --facts online,keurmerk --note "what you checked"
//                                  evidence supports the published facts: reply dispute_no_change
//   handover --run ID --dispute ID --reason "why a person must decide"
//            [--facts-json '[{"fact":"online","value":"sinds 2015"}]'] [--new-total N]
//                                  drafts the correction for a person, replies dispute_in_review
//   finish --run ID --status ok|failed --summary S
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, writeAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { FACT_LABELS, validateReplySlots, type FactKey } from "../../../lib/disputes/replies";

const AGENT = "dispute-handler";
export const PROMPT_VERSION = "d1";
/** Dispute types this agent answers. Removal and objection are code only. */
export const AGENT_TYPES = ["correction", "prenotice"] as const;
/** Score changes above this need the G4 tap (plan section 4). */
export const G4_POINTS = 10;
/** Negative inferences stay internal (CLAUDE.md section 4). */
const INTERNAL_SIGNALS = new Set(["marketplace_pattern", "dropship_indicators"]);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

/** The promised answer date for the "in beoordeling" reply: the dispute deadline, at least tomorrow. */
export function replyDeadline(deadlineAt: Date | null, now = new Date()): string {
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const d = deadlineAt && deadlineAt > tomorrow ? deadlineAt : tomorrow;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
}

/** "G4" when a proposed score change needs the human tap, else "small". */
export function scoreGate(oldTotal: number | null, newTotal: number): "G4" | "small" {
  return oldTotal == null || Math.abs(newTotal - oldTotal) > G4_POINTS ? "G4" : "small";
}

export function parseFacts(csv: string): FactKey[] {
  const list = csv.split(",").map((s) => s.trim()).filter(Boolean);
  for (const f of list) if (!Object.hasOwn(FACT_LABELS, f)) throw new Error(`unknown fact "${f}"; use ${Object.keys(FACT_LABELS).join(", ")}`);
  return list as FactKey[];
}

/** Proposed fact corrections, checked with the same rules as reply slots so a person can send them as is. */
export function parseCorrections(json: string): { fact: FactKey; value: string }[] {
  const raw = JSON.parse(json) as unknown;
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("--facts-json must be a non-empty array");
  const v = validateReplySlots("dispute_corrected", { corrected_facts: raw });
  if (!v.ok) throw new Error(`--facts-json rejected: ${v.errors.join("; ")}`);
  return v.slots.template === "dispute_corrected" ? v.slots.corrected_facts : [];
}

type Dispute = { id: string; shop_id: string; type: string; status: string; deadline_at: Date | null };

async function openDispute(sql: Sql, id: string): Promise<Dispute> {
  const [d] = await sql<Dispute[]>`
    select id, shop_id, type, status, deadline_at from public.disputes where id = ${id}`;
  if (!d) throw new Error("dispute not found");
  if (d.status !== "open" || !(AGENT_TYPES as readonly string[]).includes(d.type)) throw new Error(`dispute is ${d.type}/${d.status}, not an open correction`);
  return d;
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
          select count(*)::int as n from public.disputes where status = 'open' and type in ${sql(AGENT_TYPES)}`;
        if (n === 0) {
          // Still one run row, so the schedule gap check sees the agent is alive.
          await writeAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", status: "ok", summary: "no open disputes" });
          console.log(JSON.stringify({ work: false }));
          process.exitCode = 4;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule" });
        console.log(JSON.stringify({ run_id: id, open: n, prompt_version: PROMPT_VERSION }));
        return;
      }
      case "queue": {
        const limit = Math.min(Number(arg("limit") ?? 10), 30);
        const rows = await sql<(Dispute & { message: string | null; created_at: Date; name: string; domain: string; shop_status: string; score: number | null; keurmerk: string[]; keurmerk_status: string; product_count_est: number | null; domain_first_seen: Date | null; description_nl: string | null })[]>`
          select d.id, d.shop_id, d.type, d.status, d.deadline_at, d.message, d.created_at,
                 s.name, s.domain, s.status as shop_status, s.score, s.keurmerk, s.keurmerk_status,
                 s.product_count_est, s.domain_first_seen, s.description_nl
          from public.disputes d join public.shops s on s.id = d.shop_id
          where d.status = 'open' and d.type in ${sql(AGENT_TYPES)}
          order by d.deadline_at nulls first, d.created_at limit ${limit}`;
        for (const r of rows) {
          const signals = await sql<{ signal_key: string; value_numeric: number | null; value_bool: boolean | null; evidence_quote: string | null; quote_verified: boolean }[]>`
            select signal_key, value_numeric, value_bool, evidence_quote, quote_verified from public.shop_signals
            where shop_id = ${r.shop_id}
              and run_id = (select run_id from public.shop_signals where shop_id = ${r.shop_id} order by created_at desc limit 1)
            order by signal_key`;
          const drafts = await sql<{ n: number }[]>`
            select count(*)::int as n from public.score_overrides where shop_id = ${r.shop_id} and status = 'draft'`;
          console.log(`=== dispute ${r.id} (${r.type}), shop ${r.shop_id}, answer by ${r.deadline_at?.toISOString() ?? "unknown"}`);
          console.log(
            `published facts: score ${r.score ?? "none"}, keurmerk ${r.keurmerk.join(", ") || "none"} (${r.keurmerk_status}), ` +
              `products ${r.product_count_est ?? "unknown"}, domain first seen ${r.domain_first_seen?.toISOString().slice(0, 10) ?? "unknown"}, ` +
              `open score drafts ${drafts[0].n}`,
          );
          console.log("evidence (latest run):");
          for (const s of signals) {
            const value = s.value_numeric ?? s.value_bool ?? "";
            console.log(`- ${s.signal_key}${INTERNAL_SIGNALS.has(s.signal_key) ? " [internal, never mention]" : ""}: ${value}, quote ${s.quote_verified ? "verified" : "unverified"}`);
          }
          // Quotes, the description and the message come from the shop site or the sender.
          console.log(wrapUntrusted(
            `name: ${r.name}\ndomain: ${r.domain}\ndescription: ${r.description_nl ?? ""}\n\nquotes:\n` +
              signals.filter((s) => s.evidence_quote).map((s) => `- ${s.signal_key}: ${s.evidence_quote}`).join("\n") +
              `\n\nmessage from the sender:\n${r.message ?? "(no message)"}`,
          ));
        }
        if (rows.length === 0) console.log("queue empty");
        return;
      }
      case "no-change": {
        const runId = need("run");
        const d = await openDispute(sql, need("dispute"));
        const v = validateReplySlots("dispute_no_change", { checked_facts: parseFacts(need("facts")) });
        if (!v.ok) throw new Error(v.errors.join("; "));
        const { template, ...slots } = v.slots;
        await sql`
          update public.disputes set status = 'agent_replied', reply_template_id = ${template}, reply_slots = ${sql.json(slots)},
            resolved_note = ${need("note").slice(0, 2000)}, agent_run_id = ${runId}
          where id = ${d.id} and status = 'open'`;
        console.log(JSON.stringify({ ok: true, template }));
        return;
      }
      case "handover": {
        const runId = need("run");
        const d = await openDispute(sql, need("dispute"));
        const reason = need("reason").slice(0, 2000);
        const factsJson = arg("facts-json");
        const corrections = factsJson ? parseCorrections(factsJson) : [];
        const newTotalArg = arg("new-total");
        let gate: string | null = null;
        if (newTotalArg != null) {
          const newTotal = Number(newTotalArg);
          if (!Number.isInteger(newTotal) || newTotal < 1 || newTotal > 100) throw new Error("--new-total must be an integer 1 to 100");
          const [shop] = await sql<{ score: number | null }[]>`select score from public.shops where id = ${d.shop_id}`;
          gate = scoreGate(shop?.score ?? null, newTotal);
          await sql`
            insert into public.score_overrides (shop_id, proposed_by, old_total, new_total, reason)
            values (${d.shop_id}, 'agent', ${shop?.score ?? null}, ${newTotal}, ${`dispute ${d.id}: ${reason}`})`;
        }
        const v = validateReplySlots("dispute_in_review", { deadline_date: replyDeadline(d.deadline_at) });
        if (!v.ok) throw new Error(v.errors.join("; "));
        const { template, ...slots } = v.slots;
        await sql`
          update public.disputes set status = 'awaiting_human', reply_template_id = ${template}, reply_slots = ${sql.json(slots)},
            resolved_note = ${reason}, agent_run_id = ${runId}
          where id = ${d.id} and status = 'open'`;
        const body = [
          `Dispute \`${d.id}\` (${d.type}) for shop \`${d.shop_id}\` needs a decision by ${d.deadline_at?.toISOString() ?? "unknown"}.`,
          "",
          `Agent's reason: ${reason}`,
          corrections.length ? `\nProposed fact corrections (valid dispute_corrected slots):\n\n\`\`\`json\n${JSON.stringify({ corrected_facts: corrections }, null, 2)}\n\`\`\`` : "",
          gate ? `\nScore override drafted in score_overrides (${gate === "G4" ? "over 10 points: G4 tap needed" : "10 points or less"}).` : "",
          "\nThe sender got the \"nog in beoordeling\" reply.",
        ].join("\n");
        await sql`
          insert into public.agent_escalations (agent, kind, title, body_md, label, agent_run_id)
          values (${AGENT}, 'dispute_handover', ${`Dispute ${d.id.slice(0, 8)} needs a decision${gate === "G4" ? " (G4)" : ""}`},
                  ${body.slice(0, 8000)}, 'needs-human', ${runId})`;
        console.log(JSON.stringify({ ok: true, template, gate, corrections: corrections.length }));
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
        throw new Error("usage: disputes.ts start|queue|no-change|handover|finish");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("disputes.ts")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  });
}
