import { describe, expect, it } from "vitest";
import { findSecrets } from "./secret-patterns.mjs";

// Fake secrets are built by joining parts, so this file itself passes check-secrets.
const j = (...parts: string[]) => parts.join("");

describe("findSecrets", () => {
  it.each([
    ["Anthropic API key", j("curl -H 'x-api-key: sk-", "ant-api03-", "a".repeat(30), "'")],
    ["Supabase secret key", j("KEY=sb_", "secret_", "b".repeat(24))],
    ["JWT (Supabase service_role or anon key)", j("eyJ", "c".repeat(20), ".eyJ", "d".repeat(20), ".", "e".repeat(20))],
    ["Postgres URL with password", j("psql postgres://pipeline.ref:", "Xy9", "abc123@aws-0.pooler.supabase.com:5432/postgres")],
    ["Password assignment", j("PGPASS", "WORD=hunter2hunter2 psql")],
    ["Stripe key", j("sk_", "live_", "f".repeat(24))],
  ])("finds %s", (name, text) => {
    expect(findSecrets(text)).toContain(name);
  });

  it.each([
    'psql "$DATABASE_URL"',
    "PGPASSWORD=$PW psql",
    "postgres://pipeline:$PW@$TCPHOST:5432/postgres",
    "postgres://postgres:postgres@localhost:5432/test",
    "postgresql://postgres.ref:[YOUR-PASSWORD]@aws-0.pooler.supabase.com:5432/postgres",
    "BASIC_AUTH_PASSWORD=<from Vercel>",
    "npm run lint && npm test",
  ])("ignores %s", (text) => {
    expect(findSecrets(text)).toEqual([]);
  });
});
