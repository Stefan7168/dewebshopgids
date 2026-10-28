import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

// Plan v3 section 4. Each gate's queue arrives with its feature; until then the row says so.
const GATES: { key: string; name: string; href?: string; note?: string }[] = [
  { key: "G1", name: "Code-merge en agent-ok label", note: "in GitHub" },
  { key: "G2", name: "Gids versturen", note: "komt met de gids (fase 3)" },
  { key: "G3", name: "Uitgaande mails en pins", note: "komt met outreach" },
  { key: "G4", name: "Score-wijzigende bezwaren", note: "komt met /herbeoordeling" },
  { key: "G5", name: "Geld", note: "Stefan beslist buiten de site" },
  { key: "G6", name: "Nieuwe webshops goedkeuren", href: "/admin/kandidaten" },
];

async function AdminHome() {
  const email = await requireAdmin();
  const { data } = await createServiceClient().from("agent_settings").select("value").eq("key", "gates").maybeSingle();
  const gates = (data?.value ?? {}) as Record<string, unknown>;
  return (
    <div className="flex flex-col gap-6 text-sm">
      <p>Ingelogd als {email}.</p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Goedkeuringen</h2>
        <ul className="flex flex-col divide-y border rounded-md">
          {GATES.map((g) => (
            <li key={g.key} className="p-3 flex flex-wrap justify-between gap-2">
              <span>
                <strong>{g.key}</strong>{" "}
                {g.href ? (
                  <Link href={g.href} className="underline">
                    {g.name}
                  </Link>
                ) : (
                  g.name
                )}
                {g.note && <span className="text-muted-foreground"> · {g.note}</span>}
              </span>
              <span className="text-muted-foreground">{gates[g.key] === false ? "opgeheven" : "actief"}</span>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/admin/agents" className="underline">
        Agents: kill switch, pauzes, schema en runs
      </Link>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Beheer</h1>
      <Suspense>
        <AdminHome />
      </Suspense>
    </div>
  );
}
