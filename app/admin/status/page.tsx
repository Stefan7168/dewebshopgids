import Link from "next/link";
import { Suspense } from "react";
import { formatTime } from "@/lib/admin/ops";
import { lastNight, launchBlockers } from "@/lib/admin/status";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

const STATUSES = ["draft", "prenotified", "published", "disputed", "hidden", "removed"] as const;
type Run = { agent: string; status: string; started_at: string; summary: string | null };

async function Status() {
  await requireAdmin();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <p className="text-sm">SUPABASE_SERVICE_ROLE_KEY ontbreekt in Vercel. Zonder die sleutel kan deze pagina de database niet lezen.</p>;
  }
  const db = createServiceClient();
  // Head-only counts: exact at any size (a row select would stop at the API's 1000-row cap). An error
  // shows on the page instead of a silent 0.
  const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
    const r = await q;
    if (r.error) throw new Error(r.error.message);
    return r.count ?? 0;
  };
  const [flag, runsRes, catsRes, scheduleRes] = await Promise.all([
    db.from("agent_settings").select("value").eq("key", "prenotice_enabled").maybeSingle(),
    db.from("agent_runs").select("agent, status, started_at, summary").eq("trigger", "pipeline").order("started_at", { ascending: false }).limit(40),
    db.from("categories").select("id, parent_id, name_nl"),
    db.from("agent_schedule").select("agent"),
  ]);
  const err = runsRes.error ?? catsRes.error ?? scheduleRes.error;
  if (err) return <p className="text-sm text-red-600">Fout: {err.message}</p>;

  const cats = catsRes.data as { id: string; parent_id: string | null; name_nl: string }[];
  const roots = cats.filter((c) => c.parent_id === null);
  const subtree = (root: string) => cats.filter((c) => c.id === root || c.parent_id === root).map((c) => c.id);
  let counts: [number, number, number, number[], number[]];
  try {
    counts = await Promise.all([
      count(db.from("email_queue").select("id", { count: "exact", head: true }).not("sent_at", "is", null)),
      count(db.from("shop_candidates").select("id", { count: "exact", head: true }).eq("status", "new")),
      count(db.from("agent_runs").select("id", { count: "exact", head: true }).eq("agent", "score-submit").eq("status", "ok").like("summary", "submitted%")),
      Promise.all(STATUSES.map((s) => count(db.from("shops").select("id", { count: "exact", head: true }).eq("status", s)))),
      Promise.all(roots.map((r) => count(db.from("shops").select("id", { count: "exact", head: true }).eq("status", "published").in("category_id", subtree(r.id))))),
    ]);
  } catch (e) {
    return <p className="text-sm text-red-600">Fout: {(e as Error).message}</p>;
  }
  const [emailsSent, candidates, batchesSubmitted, statusCounts, publishedPerRoot] = counts;

  const runs = runsRes.data as Run[];
  const blockers = launchBlockers({ env: process.env, pipelineRuns: runs, batchesSubmitted, emailsSent, prenoticeOn: flag.data?.value === true });
  const night = lastNight(runs);
  const perRoot = new Map(roots.map((r, i) => [r.name_nl, publishedPerRoot[i]]));

  const agents = [...new Set((scheduleRes.data as { agent: string }[]).map((s) => s.agent))].sort();
  const agentRuns = await Promise.all(
    agents.map(async (a) => {
      const { data } = await db.from("agent_runs").select("status, started_at").eq("agent", a).order("started_at", { ascending: false }).limit(1).maybeSingle();
      return { agent: a, status: (data?.status as string | undefined) ?? null, started_at: (data?.started_at as string | undefined) ?? null };
    }),
  );

  return (
    <div className="flex flex-col gap-6 text-sm">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Wat publiceren nog tegenhoudt</h2>
        <ul className="flex flex-col divide-y border rounded-md">
          {blockers.map((b) => (
            <li key={b.key} className="p-3 flex flex-wrap justify-between gap-2">
              <span>
                <span aria-hidden="true">{b.ok ? "✓" : "✗"}</span> <strong>{b.label}</strong>
                <span className="sr-only">{b.ok ? " (klaar)" : " (open)"}</span>
              </span>
              <span className="text-muted-foreground">
                {b.detail}
                {b.href && !b.ok && (
                  <>
                    {" · "}
                    <Link href={b.href} className="underline">
                      regelen
                    </Link>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">De volgorde en wat elke stap ontgrendelt staat in setup-for-stefan.md.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Aantallen</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Kandidaten om te beoordelen</dt>
          <dd>
            {candidates} · <Link href="/admin/kandidaten" className="underline">beoordelen</Link>
          </dd>
          {STATUSES.map((s, i) => (
            <div key={s} className="contents">
              <dt className="text-muted-foreground">Webshops {s}</dt>
              <dd>{statusCounts[i]}</dd>
            </div>
          ))}
          {[...perRoot].sort((a, b) => b[1] - a[1]).map(([name, n]) => (
            <div key={name} className="contents">
              <dt className="text-muted-foreground">Gepubliceerd in {name}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Laatste nacht</h2>
        {night.length ? (
          <ul className="flex flex-col divide-y border rounded-md">
            {night.map((r) => (
              <li key={`${r.agent}-${r.started_at}`} className="p-3 flex flex-col gap-1">
                <span>
                  <strong>{r.agent}</strong> · {r.status} · {formatTime(r.started_at)}
                </span>
                {r.summary && <span className="text-muted-foreground break-words">{r.summary}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nog geen nachtelijke run in de database.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Agents: laatste run</h2>
        <ul className="flex flex-col divide-y border rounded-md">
          {agentRuns.map((a) => (
            <li key={a.agent} className="p-3 flex flex-wrap justify-between gap-2">
              <strong>{a.agent}</strong>
              <span className="text-muted-foreground">{a.started_at ? `${a.status} · ${formatTime(a.started_at)}` : "nog nooit"}</span>
            </li>
          ))}
        </ul>
        <Link href="/admin/agents" className="underline">
          Details, pauzes en kill switch
        </Link>
      </section>
    </div>
  );
}

export default function StatusPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Status</h1>
      <Suspense>
        <Status />
      </Suspense>
    </div>
  );
}
