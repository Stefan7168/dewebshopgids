// Enable login for one agent role (or `pipeline`) and set a fresh password.
// Prints the password once; paste it into that agent's routine connector or
// GitHub secret and nowhere else. Re-run after kill-switch.yml to re-enable.
//
// Usage: DATABASE_URL=<admin connection string> tsx scripts/agents/set-role-password.ts agent_scout
import { randomBytes } from "node:crypto";
import { connect } from "../../agents/shared/audit";
import { AGENT_ROLES } from "./roles";

const ALLOWED = new Set<string>([...AGENT_ROLES, "pipeline"]);
const PROJECT_REF = "khljuorpncjrswgcayow";

async function main() {
  const role = process.argv[2];
  if (!role || !ALLOWED.has(role)) {
    console.error(`usage: set-role-password.ts <${[...ALLOWED].join("|")}>`);
    process.exit(2);
  }
  const password = randomBytes(32).toString("base64url");
  const sql = connect();
  try {
    // role is from the fixed allowlist above; the password is random base64url.
    await sql.unsafe(`alter role "${role}" login password '${password}'`);
  } finally {
    await sql.end();
  }
  console.log(`role:     ${role}`);
  console.log(`user:     ${role}.${PROJECT_REF}   (Supavisor pooler user name)`);
  console.log(`password: ${password}`);
  console.log("Use the pooler connection string from Supabase > Connect, with this user and password.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
