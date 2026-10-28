// Shop Scout tools. The routine runs these with DATABASE_URL set to the
// agent_scout role over the Supavisor pooler. Commands:
//   start                         guards + agent_runs row; prints {"run_id"}; exit 3 = paused, stop
//   pending [--limit 60]          source_lists domains not yet a shop or candidate (untrusted data)
//   categories                    category slugs to choose from
//   propose --run ID --domain D --name N --category SLUG --reason R
//                                 insert one candidate (max 25 per day, enforced here and by RLS status='new')
//   finish --run ID --status ok|failed --summary S
import { connect, finishAgentRun, startAgentRun, checkKillSwitch } from "../../shared/audit";
import { wrapUntrusted } from "../../shared/untrusted";
import { normalizeDomain } from "../../../scripts/pipeline/domain";

const AGENT = "shop-scout";
export const MAX_PER_DAY = 25;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function need(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`missing --${name}`);
  return v;
}

async function main() {
  const cmd = process.argv[2];
  const sql = connect();
  try {
    switch (cmd) {
      case "start": {
        const guard = await checkKillSwitch(sql, AGENT);
        if (!guard.ok) {
          console.log(JSON.stringify({ paused: true, reason: guard.reason }));
          process.exitCode = 3;
          return;
        }
        const id = await startAgentRun(sql, { agent: AGENT, runsOn: "routine", trigger: "schedule" });
        console.log(JSON.stringify({ run_id: id }));
        return;
      }
      case "pending": {
        const limit = Math.min(Number(arg("limit") ?? 60), 200);
        const rows = await sql<{ domain: string; name: string | null; source: string }[]>`
          select s.domain, s.name, s.source
          from public.source_lists s
          where not exists (select 1 from public.shops x where x.domain = s.domain)
            and not exists (select 1 from public.shop_candidates c where c.domain = s.domain)
          order by s.imported_at, s.domain
          limit ${limit}`;
        console.log(wrapUntrusted(rows.map((r) => `${r.domain}\t${r.name ?? ""}\t${r.source}`).join("\n")));
        return;
      }
      case "categories": {
        const rows = await sql<{ slug: string; name_nl: string }[]>`
          select slug, name_nl from public.categories order by sort_order, slug`;
        console.log(rows.map((r) => `${r.slug}\t${r.name_nl}`).join("\n"));
        return;
      }
      case "propose": {
        const runId = need("run");
        const domain = normalizeDomain(need("domain"));
        if (!domain) throw new Error("invalid domain");
        const [{ n }] = await sql<{ n: number }[]>`
          select count(*)::int as n from public.shop_candidates
          where source like 'scout:%' and created_at > now() - interval '24 hours'`;
        if (n >= MAX_PER_DAY) {
          console.log(JSON.stringify({ ok: false, reason: `daily cap of ${MAX_PER_DAY} reached` }));
          process.exitCode = 4;
          return;
        }
        const [src] = await sql<{ source: string }[]>`
          select source from public.source_lists where domain = ${domain} limit 1`;
        if (!src) throw new Error("domain is not in source_lists; the scout may only propose listed domains");
        const [cat] = await sql<{ id: string }[]>`
          select id from public.categories where slug = ${need("category")}`;
        if (!cat) throw new Error("unknown category slug");
        const reason = need("reason").slice(0, 500);
        const name = (arg("name") ?? "").slice(0, 200) || null;
        const inserted = await sql`
          insert into public.shop_candidates (domain, name, source, reason, suggested_category_id, agent_run_id)
          values (${domain}, ${name}, ${`scout:${src.source}`}, ${reason}, ${cat.id}, ${runId})
          on conflict (domain) do nothing
          returning id`;
        console.log(JSON.stringify({ ok: inserted.length === 1, domain, duplicate: inserted.length === 0 }));
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
        throw new Error("usage: scout.ts start|pending|categories|propose|finish");
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
