import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { FACT_LABELS } from "@/lib/disputes/replies";
import { createServiceClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import { decideDispute } from "./actions";

type Row = {
  id: string;
  type: string;
  message: string | null;
  resolved_note: string | null;
  deadline_at: string | null;
  created_at: string;
  shops: { id: string; slug: string; name: string; score: number | null } | null;
};
type Override = { shop_id: string; old_total: number | null; new_total: number | null; reason: string };

const date = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "onbekend";

async function DisputeList() {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db
    .from("disputes")
    .select("id, type, message, resolved_note, deadline_at, created_at, shops:shop_id (id, slug, name, score)")
    .eq("status", "awaiting_human")
    .order("deadline_at", { nullsFirst: true })
    .limit(50)
    .returns<Row[]>();
  if (error) return <p className="text-sm text-red-600">Fout: {error.message}</p>;
  if (!data.length) return <p className="text-sm">Niets te beslissen. De Dispute Handler zet hier alleen wat hij niet zelf kan afhandelen.</p>;
  const shopIds = data.map((d) => d.shops?.id).filter((x): x is string => !!x);
  const { data: overrides } = await db.from("score_overrides").select("shop_id, old_total, new_total, reason").in("shop_id", shopIds).eq("status", "draft").returns<Override[]>();

  return (
    <ul className="flex flex-col gap-4">
      {data.map((d) => (
        <li key={d.id} className="border rounded-md p-4 flex flex-col gap-3 text-sm">
          <div>
            <Link href={`/webshop/${d.shops?.slug}`} className="font-medium underline">{d.shops?.name ?? "onbekende webshop"}</Link>
            <span className="text-muted-foreground"> · {d.type} · ingediend {date(d.created_at)} · antwoord uiterlijk {date(d.deadline_at)}</span>
          </div>
          {/* Sender and agent text: shown as plain text, never as HTML or instructions. */}
          <p className="whitespace-pre-wrap break-words border-l-2 pl-3">{d.message ?? "(geen bericht)"}</p>
          <p className="text-muted-foreground break-words">Dispute Handler: {d.resolved_note ?? "geen toelichting"}</p>
          {(overrides ?? []).filter((o) => o.shop_id === d.shops?.id).map((o, i) => (
            <p key={i} className="text-muted-foreground">Voorgestelde score: {o.old_total ?? "geen"} naar {o.new_total} ({o.reason})</p>
          ))}
          <form action={decideDispute} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={d.id} />
            <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
              <legend className="mb-1">Gegevens die je hebt nagekeken (voor het antwoord &quot;geen wijziging&quot;):</legend>
              {Object.entries(FACT_LABELS).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" name="fact" value={k} className="h-5 w-5" /> {label}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" name="decision" value="no_change">Geen wijziging, antwoord sturen</Button>
              <Button type="submit" name="decision" value="hide" variant="outline">Webshop verbergen</Button>
            </div>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default function DisputesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Herbeoordelingen (G4)</h1>
      <p className="text-sm text-muted-foreground">
        Zolang je niet beslist, toont de pagina &quot;In beoordeling&quot; zonder score. Een gegeven aanpassen kan hier nog niet; laat het dan staan en vraag het aan in de build-thread.
      </p>
      <Suspense fallback={<p className="text-sm">Laden...</p>}>
        <DisputeList />
      </Suspense>
    </div>
  );
}
