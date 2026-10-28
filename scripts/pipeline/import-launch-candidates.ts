// One-off import of a vetted list (scripts/pipeline/sources/launch-candidates.csv, or
// garden-candidates.csv with `garden`, home-candidates-2.csv with `home2`) into shop_candidates, so Stefan approves them at /admin/kandidaten like any Scout proposal.
// Idempotent: domains that are already a shop or candidate (also under their old domain) are skipped.
// Bypasses the Scout's 25-per-day limit on purpose: every row was researched by hand.
//
// Usage: DATABASE_URL=<agent_scout or pipeline connection string> tsx scripts/pipeline/import-launch-candidates.ts [garden|home2]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { GARDEN_SOURCE, HOME2_SOURCE, LAUNCH_SOURCE, launchCandidates } from "./sources/launch-candidates";

export const LISTS = {
  launch: { file: "launch-candidates.csv", source: LAUNCH_SOURCE },
  garden: { file: "garden-candidates.csv", source: GARDEN_SOURCE },
  home2: { file: "home-candidates-2.csv", source: HOME2_SOURCE },
} as const;

export async function importLaunchCandidates(sql: Sql, runId: string | null, csv: string, source: string = LAUNCH_SOURCE) {
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
      values (${c.domain}, ${c.name}, ${source}, ${c.reason}, ${catId}, ${runId})
      on conflict (domain) do nothing
      returning id`;
    if (rows.length) inserted++;
    else skipped++;
  }
  return { summary: `${source}: ${inserted} new candidate(s), ${skipped} already known` };
}

if (process.argv[1]?.endsWith("import-launch-candidates.ts")) {
  const sql = connect();
  const arg = process.argv[2];
  const list = arg === "garden" || arg === "home2" ? LISTS[arg] : LISTS.launch;
  const csv = readFileSync(join(__dirname, "sources", list.file), "utf8");
  runAgentJob(sql, { agent: "shop-scout", runsOn: "code", trigger: "manual" }, (runId) => importLaunchCandidates(sql, runId, csv, list.source))
    .then((status) => console.log(status))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => sql.end());
}
