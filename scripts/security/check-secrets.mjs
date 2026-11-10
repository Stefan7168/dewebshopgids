// Fails when a Claude Code local settings file is tracked, or when a tracked file holds a
// literal secret. Runs in `npm run lint`, so CI checks every PR and push.
// Prints file names and secret types only, never the secret.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { findSecrets } from "./secret-patterns.mjs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const problems = [];

for (const file of files) {
  if (/(^|\/)\.claude\/[^/]*\.local\.json$|(^|\/)CLAUDE\.local\.md$/.test(file)) {
    problems.push(`${file}: personal Claude Code file, must not be committed (git rm --cached it)`);
    continue;
  }
  if (file === "package-lock.json" || /\.(png|jpe?g|gif|webp|ico|woff2?|pdf)$/i.test(file)) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // deleted in the working tree
  }
  for (const name of findSecrets(text)) problems.push(`${file}: ${name}`);
}

if (problems.length > 0) {
  console.error("Secret check failed:\n  " + problems.join("\n  "));
  console.error("Move secrets to .env.local, GitHub Environment secrets or Vercel env vars, then rotate them.");
  process.exit(1);
}
console.log(`Secret check: ${files.length} tracked files, no secrets.`);
