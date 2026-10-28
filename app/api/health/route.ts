import { connection, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Health for the uptime monitor (plan v3 section 8, step 10): the newest
// score_runs, agent_runs and health_checks rows. 503 when any is missing or
// older than 48 hours, or when the database cannot be read. Timestamps and
// statuses only: this route is public.
const STALE_AFTER_MS = 48 * 3600 * 1000;

const SOURCES = [
  { table: "score_runs", column: "started_at" },
  { table: "agent_runs", column: "started_at" },
  { table: "health_checks", column: "checked_at" },
] as const;

export async function GET() {
  await connection(); // never prerender: the answer must be live
  const now = Date.now();
  let db;
  try {
    db = createServiceClient();
  } catch {
    return NextResponse.json({ ok: false, error: "database not configured" }, { status: 503 });
  }
  const newest: Record<string, { at: string | null; status: string | null }> = {};
  const stale: string[] = [];
  for (const { table, column } of SOURCES) {
    const { data, error } = await db.from(table).select(`${column}, status`).order(column, { ascending: false }).limit(1);
    if (error) return NextResponse.json({ ok: false, error: `cannot read ${table}` }, { status: 503 });
    const row = (data?.[0] ?? null) as Record<string, string> | null;
    const at = row?.[column] ?? null;
    newest[table] = { at, status: row?.status ?? null };
    if (!at || now - new Date(at).getTime() > STALE_AFTER_MS) stale.push(table);
  }
  const ok = stale.length === 0;
  return NextResponse.json({ ok, time: new Date(now).toISOString(), stale, newest }, { status: ok ? 200 : 503 });
}
