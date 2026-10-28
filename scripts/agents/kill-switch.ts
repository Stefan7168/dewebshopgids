// Hard kill switch (plan section 7). Run by .github/workflows/kill-switch.yml
// with an admin DATABASE_URL. For every agent role that exists:
// NOLOGIN, rotate the password to a random value nobody knows, and terminate
// its open connections. Re-enabling an agent means setting a new password in
// its routine and running ALTER ROLE ... LOGIN by hand.
//
// Usage: tsx scripts/agents/kill-switch.ts [--if-flag-off]
//   --if-flag-off  only act when agent_settings.agents_enabled is not true
import { randomBytes } from "node:crypto";
import { connect } from "../../agents/shared/audit";
import { AGENT_ROLES } from "./roles";

async function main() {
  const onlyIfFlagOff = process.argv.includes("--if-flag-off");
  const sql = connect();
  try {
    if (onlyIfFlagOff) {
      const [row] = await sql<{ value: unknown }[]>`
        select value from public.agent_settings where key = 'agents_enabled'`;
      if (row?.value === true) {
        console.log("agents_enabled is true: nothing to do");
        return;
      }
    }
    const existing = await sql<{ rolname: string; rolcanlogin: boolean }[]>`
      select rolname, rolcanlogin from pg_roles where rolname in ${sql(AGENT_ROLES as unknown as string[])}`;
    if (onlyIfFlagOff && existing.every((r) => !r.rolcanlogin)) {
      console.log("all agent roles already NOLOGIN: nothing to do");
      return;
    }
    for (const { rolname } of existing) {
      const password = randomBytes(32).toString("base64url");
      // Role names come from the fixed AGENT_ROLES list; the password is random base64url.
      await sql.unsafe(`alter role "${rolname}" nologin password '${password}'`);
      const killed = await sql<{ n: number }[]>`
        select count(*)::int as n from (
          select pg_terminate_backend(pid) from pg_stat_activity where usename = ${rolname}
        ) t`;
      console.log(`${rolname}: NOLOGIN, password rotated, ${killed[0].n} connection(s) terminated`);
    }
    const missing = AGENT_ROLES.filter((r) => !existing.some((e) => e.rolname === r));
    if (missing.length) console.log(`not created yet (skipped): ${missing.join(", ")}`);
    await sql`
      insert into public.agent_settings (key, value, updated_by)
      values ('agents_enabled', 'false'::jsonb, 'kill-switch')
      on conflict (key) do update set value = 'false'::jsonb, updated_by = 'kill-switch'`;
    await sql`
      insert into public.agent_runs (agent, runs_on, trigger, status, finished_at, summary)
      values ('kill-switch', 'code', ${onlyIfFlagOff ? "flag" : "dispatch"}, 'ok', now(),
              ${`disabled ${existing.length} role(s)`})`;
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
