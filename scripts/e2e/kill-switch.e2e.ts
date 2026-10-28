// End-to-end check of the hard kill switch (started by scripts/e2e/run.sh after the nightly run):
// it must lock the `pipeline` login as well as the agent roles, and cut an open pipeline session.
import assert from "node:assert/strict";
import postgres from "postgres";
import { connect } from "../../agents/shared/audit";
import { runKillSwitch } from "../agents/kill-switch";

async function main() {
  const admin = postgres({ database: process.env.E2E_DB, max: 1, onnotice: () => {} });
  const open = connect(process.env.E2E_PIPELINE_URL);
  try {
    await open`select 1`;
    await runKillSwitch(admin, false);

    const roles = await admin<{ rolname: string; rolcanlogin: boolean }[]>`
      select rolname, rolcanlogin from pg_roles where rolname = 'pipeline' or rolname like 'agent\\_%'`;
    assert.ok(
      roles.some((r) => r.rolname === "pipeline"),
      "pipeline role exists",
    );
    assert.deepEqual(
      roles.filter((r) => r.rolcanlogin).map((r) => r.rolname),
      [],
      "every role is NOLOGIN",
    );

    await assert.rejects(open`select 1`, "the open pipeline session was terminated");
    const late = connect(process.env.E2E_PIPELINE_URL);
    await assert.rejects(late`select 1`, "a new pipeline login is refused");
    await late.end().catch(() => {});

    const [flag] = await admin<
      { value: unknown }[]
    >`select value from public.agent_settings where key = 'agents_enabled'`;
    assert.equal(flag?.value, false, "agents_enabled is false");
    console.log("kill switch e2e: ok");
  } finally {
    await open.end().catch(() => {});
    await admin.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
