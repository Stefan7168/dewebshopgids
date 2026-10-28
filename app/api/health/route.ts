import { connection, NextResponse } from "next/server";

// Liveness only for now. Task 15 adds the newest score_runs, agent_runs and
// health_checks rows so the uptime monitor can alert on stale pipelines.
export async function GET() {
  await connection(); // never prerender: the timestamp must be live
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
