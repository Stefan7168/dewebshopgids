// Literal secrets this project uses. Shared by the Claude Code hook in
// .claude/hooks/block-inline-secrets.mjs and by scripts/security/check-secrets.mjs.
// A variable reference ($VAR, ${VAR}, <placeholder>, [YOUR-PASSWORD]) never matches.

/** @type {{ name: string, re: RegExp }[]} */
export const SECRET_PATTERNS = [
  { name: "Anthropic API key", re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "Supabase secret key", re: /sb_secret_[A-Za-z0-9_-]{16,}/ },
  { name: "Supabase access token", re: /sbp_[a-f0-9]{30,}/ },
  { name: "JWT (Supabase service_role or anon key)", re: /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "Stripe key", re: /\b[sr]k_(live|test)_[A-Za-z0-9]{16,}/ },
  { name: "Stripe webhook secret", re: /whsec_[A-Za-z0-9]{16,}/ },
  { name: "Resend API key", re: /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}/ },
  { name: "GitHub token", re: /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/ },
  { name: "Vercel token", re: /\bvcp_[A-Za-z0-9]{20,}/ },
  { name: "Private key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    // user:password@host with a literal password, except local test databases.
    name: "Postgres URL with password",
    re: /postgres(?:ql)?:\/\/[^\s:/@"'`]+:(?![$<[{])[^\s@"'`]{6,}@(?!(?:localhost|127\.0\.0\.1|postgres)[:/])[^\s"'`]+/,
  },
  {
    // PGPASSWORD=xyz or BASIC_AUTH_PASSWORD=xyz typed into a command.
    name: "Password assignment",
    re: /\b[A-Z_]*PASSWORD=(?![$<"'`[{])[^\s"'`]{8,}/,
  },
];

/** Returns the names of the patterns found in text (never the secret itself). */
export function findSecrets(text) {
  return SECRET_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
}
