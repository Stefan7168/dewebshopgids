import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { formatTime, pausedAgents, scheduleGaps, type ScheduleRow } from "@/lib/admin/ops";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { enableAgents, unpauseAgent } from "./actions";
import { KillForm } from "./kill-form";

type Run = { id: string; agent: string; runs_on: string; started_at: string; finished_at: string | null; status: string; summary: string | null; error: string | null; cost_usd_est: number | null };
type Health = { check: string; status: string; checked_at: string };

const STATUS_CLASS: Record<string, string> = { ok: "text-green-700", warn: "text-amber-700", fail: "text-red-700", failed: "text-red-700" };

async function AgentsPanel() {
  await requireAdmin();
  const db = createServiceClient();
  const [settingsRes, scheduleRes, runsRes, healthRes] = await Promise.all([
    db.from("agent_settings").select("key, value"),
    db.from("agent_schedule").select("agent, cron, timezone, max_gap_minutes"),
    db.from("agent_runs").select("id, agent, runs_on, started_at, finished_at, status, summary, error, cost_usd_est").order("started_at", { ascending: false }).limit(50),
    db.from("health_checks").select("check, status, checked_at").order("checked_at", { ascending: false }).limit(100),
  ]);
  const err = settingsRes.error ?? scheduleRes.error ?? runsRes.error ?? healthRes.error;
  if (err) return <p className="text-sm text-red-600">Fout: {err.message}</p>;

  const settings = settingsRes.data as { key: string; value: unknown }[];
  const enabled = settings.find((s) => s.key === "agents_enabled")?.value === true;
  const paused = pausedAgents(settings);
  const schedule = scheduleRes.data as ScheduleRow[];
  const lastRuns = new Map<string, string>();
  await Promise.all(
    schedule.map(async (s) => {
      const { data } = await db.from("agent_runs").select("started_at").eq("agent", s.agent).order("started_at", { ascending: false }).limit(1).maybeSingle();
      if (data) lastRuns.set(s.agent, data.started_at as string);
    }),
  );
  const gaps = scheduleGaps(schedule, lastRuns, new Date());
  const latestHealth = new Map<string, Health>();
  for (const h of healthRes.data as Health[]) if (!latestHealth.has(h.check)) latestHealth.set(h.check, h);
  const runs = runsRes.data as Run[];

  return (
    <div className="flex flex-col gap-8 text-sm">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Kill switch</h2>
        <p>
          Status: <strong className={enabled ? "text-green-700" : "text-red-700"}>{enabled ? "agents staan aan" : "alle agents staan uit"}</strong>
        </p>
        {enabled ? (
          <KillForm />
        ) : (
          <form action={enableAgents} className="flex flex-col gap-2">
            <p className="text-muted-foreground">
              Na de workflow Kill switch hebben de agent-rollen geen login meer. Zet ze daarna per rol weer aan met
              scripts/agents/set-role-password.ts en zet de nieuwe wachtwoorden in de routines.
            </p>
            <Button type="submit" variant="outline" className="w-fit">
              Agents weer aanzetten
            </Button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Gepauzeerd</h2>
        {paused.length === 0 ? (
          <p className="text-muted-foreground">Geen agent gepauzeerd.</p>
        ) : (
          <ul className="flex flex-col divide-y border rounded-md">
            {paused.map((p) => (
              <li key={p.agent} className="flex items-center justify-between gap-3 p-3">
                <span>
                  {p.agent} <span className="text-muted-foreground">{p.until ? `pauze tot ${formatTime(p.until)}` : "handmatig uitgezet"}</span>
                </span>
                <form action={unpauseAgent}>
                  <input type="hidden" name="agent" value={p.agent} />
                  <Button type="submit" size="sm">Weer aanzetten</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Schema en gaten</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted-foreground">
              <tr><th className="py-1 pr-3">Agent</th><th className="pr-3">Laatste start</th><th className="pr-3">Max gat</th><th>Status</th></tr>
            </thead>
            <tbody>
              {gaps.map((g) => (
                <tr key={g.agent} className="border-t">
                  <td className="py-1 pr-3">{g.agent}</td>
                  <td className="pr-3">{formatTime(g.lastRun)}</td>
                  <td className="pr-3">{Math.round(g.max_gap_minutes / 60)} u</td>
                  <td className={g.late ? "text-red-700" : "text-green-700"}>{g.late ? "te laat" : "ok"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {gaps.length === 0 && <p className="text-muted-foreground">Nog geen schema: de gap-job vult het bij de eerste run.</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Health checks</h2>
        <ul className="flex flex-col gap-1">
          {[...latestHealth.values()].map((h) => (
            <li key={h.check}>
              {h.check}: <span className={STATUS_CLASS[h.status]}>{h.status}</span> <span className="text-muted-foreground">({formatTime(h.checked_at)})</span>
            </li>
          ))}
          {latestHealth.size === 0 && <li className="text-muted-foreground">Nog geen checks.</li>}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Laatste 50 runs</h2>
        <ul className="flex flex-col divide-y border rounded-md">
          {runs.map((r) => (
            <li key={r.id} className="p-3 flex flex-col gap-1">
              <span>
                <strong>{r.agent}</strong> <span className={STATUS_CLASS[r.status] ?? ""}>{r.status}</span>{" "}
                <span className="text-muted-foreground">
                  {formatTime(r.started_at)} · {r.runs_on}
                  {r.cost_usd_est ? ` · USD ${r.cost_usd_est}` : ""}
                </span>
              </span>
              {/* summary and error can quote scraped text: rendered as plain text only */}
              {r.summary && <span className="text-muted-foreground break-words">{r.summary.slice(0, 500)}</span>}
              {r.error && <span className="text-red-700 break-words">{r.error.slice(0, 500)}</span>}
            </li>
          ))}
          {runs.length === 0 && <li className="p-3 text-muted-foreground">Nog geen runs.</li>}
        </ul>
      </section>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Agents</h1>
      <Suspense>
        <AgentsPanel />
      </Suspense>
    </div>
  );
}
