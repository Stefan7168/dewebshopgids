// Enable login for one agent role (or `pipeline`) and set a fresh password.
// Prints the password once; paste it into that agent's routine connector or
// GitHub secret and nowhere else. Re-run after kill-switch.yml to re-enable.
//
// Usage: npx tsx scripts/agents/set-role-password.ts agent_scout
// It asks for the admin connection string without echo. Never put it in the command line:
// Claude Code saves approved commands verbatim in .claude/settings.local.json.
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";
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
  const sql = connect(process.env.DATABASE_URL || (await askHidden("Admin connection string: ")));
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

function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
    // Print the prompt, then echo nothing while the secret is typed.
    process.stderr.write(prompt);
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      process.stderr.write("\n");
      resolve(answer.trim());
    });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
