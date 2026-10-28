// One-off import of the vetted launch list (scripts/pipeline/sources/launch-candidates.csv)
// into shop_candidates, so Stefan approves them at /admin/kandidaten like any Scout proposal.
// Idempotent: domains that are already a shop or candidate (also under their old domain) are skipped.
// Bypasses the Scout's 25-per-day limit on purpose: every row was researched by hand.
//
// Usage: DATABASE_URL=<agent_scout or pipeline connection string> tsx scripts/pipeline/import-launch-candidates.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { LAUNCH_SOURCE, launchCandidates } from "./sources/launch-candidates";

export async function importLaunchCandidates(sql: Sql, runId: string | null, csv: string) {
  const categories = await sql<{ id: string; slug: string }[]>`select id, slug from public.categories`;
  const known = new Set(
    (await sql<{ domain: string }[]>`
      select domain from public.shop_candidates union select domain from public.shops`).map((r) => r.domain),
  );
  let inserted = 0;
  let skipped = 0;
  for (const c of launchCandidates(csv, categories.map((x) => x.slug))) {
    if ([c.domain, ...c.aliases].some((d) => known.has(d))) {
      skipped++;
      continue;
    }
    const catId = categories.find((x) => x.slug === c.category)!.id;
    const rows = await sql`
      insert into public.shop_candidates (domain, name, source, reason, suggested_category_id, agent_run_id)
      values (${c.domain}, ${c.name}, ${LAUNCH_SOURCE}, ${c.reason}, ${catId}, ${runId})
      on conflict (domain) do nothing
      returning id`;
    if (rows.length) inserted++;
    else skipped++;
  }
  return { summary: `launch list: ${inserted} new candidate(s), ${skipped} already known` };
}

if (process.argv[1]?.endsWith("import-launch-candidates.ts")) {
  const sql = connect();
  const csv = readFileSync(join(__dirname, "sources", "launch-candidates.csv"), "utf8");
  runAgentJob(sql, { agent: "shop-scout", runsOn: "code", trigger: "manual" }, (runId) => importLaunchCandidates(sql, runId, csv))
    .then((status) => console.log(status))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => sql.end());
}
