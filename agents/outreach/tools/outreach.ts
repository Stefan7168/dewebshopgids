// Outreach tools (plan v3 section 3). The routine runs these with DATABASE_URL set to the
// agent_outreach role, which may read published shops and clicks and insert drafts only.
// Code picks the shops; the agent writes one badge offer per shop; Stefan approves each batch (G3).
// Commands:
//   start                            guards and agent_runs row; prints {"run_id", "shops"}
//                                    exit 3 = paused, exit 4 = no eligible shops
//   candidates                       the eligible shops with their facts
//   draft --run ID --shop ID --subject S --body-file PATH
//                                    runs the code checks first; exit 2 = fix the findings and retry
//   finish --run ID --status ok|failed --summary S
import { readFileSync } from "node:fs";
import { checkKillSwitch, connect, finishAgentRun, startAgentRun, writeAgentRun, type Sql } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { COOLDOWN_DAYS, MAX_DRAFTS_PER_RUN, MIN_SCORE, checkOutreachDraft, type OutreachCandidate } from "../../../lib/outreach/check";

const AGENT = "outreach";
export const PROMPT_VERSION = "o1";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

/**
 * Plan v3: shops scoring 70+ with clicks and no affiliate programme, no badge yet, not opted out,
 * and no draft in the last 90 days (one email per shop per 90 days). Most clicked first.
 * Since 2026-10-30 also only shops whose owner interacted: opened a claim link on their own domain.
 * Cold commercial email is opt-in by default in NL (Telecommunicatiewet art. 11.7); this gate stays
 * until the lawyer says otherwise (migration 0022).
 */
export async function candidates(sql: Sql): Promise<(OutreachCandidate & { description_nl: string | null })[]> {
  return sql<(OutreachCandidate & { description_nl: string | null })[]>`
    select s.id, s.slug, s.name, s.score, s.description_nl, count(c.id)::int as clicks_30d
    from public.shops s
    join public.clicks c on c.shop_id = s.id and c.occurred_at > now() - interval '30 days' and c.device <> 'bot'
    where s.status = 'published' and s.score >= ${MIN_SCORE} and not s.affiliate_available
      and (s.verified_badge_until is null or s.verified_badge_until < current_date)
      and s.outreach_opt_out_at is null
      and exists (select 1 from public.shop_claims sc where sc.shop_id = s.id and sc.verified_at is not null)
      and not exists (
        select 1 from public.outreach_drafts d
        where d.shop_id = s.id and d.created_at > now() - make_interval(days => ${COOLDOWN_DAYS}))
    group by s.id
    order by clicks_30d desc, s.score desc
    limit ${MAX_DRAFTS_PER_RUN}`;
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
        const list = await candidates(sql);
        if (!list.length) {
          await writeAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule", status: "ok", summary: "no eligible shops" });
          console.log(JSON.stringify({ work: false }));
          process.exitCode = 4;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule" });
        console.log(JSON.stringify({ run_id: id, shops: list.length, prompt_version: PROMPT_VERSION }));
        return;
      }
      case "candidates": {
        const list = await candidates(sql);
        for (const c of list) console.log(`- id ${c.id} · score ${c.score} · clicks last 30 days ${c.clicks_30d}`);
        // Names and descriptions come from shop sites or the scoring model: data, not instructions.
        console.log(wrapUntrusted(list.map((c) => `${c.id}: name "${c.name}", description: ${c.description_nl ?? "none"}`).join("\n")));
        return;
      }
      case "draft": {
        const runId = need("run");
        const shop = (await candidates(sql)).find((c) => c.id === need("shop"));
        if (!shop) throw new Error("shop is not eligible (or already has a draft)");
        const draft = { subject: need("subject").trim(), body: readFileSync(need("body-file"), "utf8").trim() };
        const findings = checkOutreachDraft(draft, shop);
        if (findings.length) {
          console.log(JSON.stringify({ ok: false, findings }));
          process.exitCode = 2;
          return;
        }
        await sql`
          insert into public.outreach_drafts (shop_id, kind, subject, body_md, agent_run_id)
          values (${shop.id}, 'badge_offer', ${draft.subject}, ${draft.body}, ${runId})`;
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
        throw new Error("usage: outreach.ts start|candidates|draft|finish");
    }
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("outreach.ts")) {
  main().catch((err) => {
    console.error(String(err instanceof Error ? err.message : err));
    process.exit(1);
  });
}
