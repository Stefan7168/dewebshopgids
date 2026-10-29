import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import { decideCandidates, rejectCandidate } from "./actions";

type Candidate = {
  id: string;
  domain: string;
  name: string | null;
  source: string;
  reason: string | null;
  created_at: string;
  categories: { name_nl: string } | null;
};

async function CandidateList() {
  await requireAdmin();
  const { data, error, count } = await createServiceClient()
    .from("shop_candidates")
    .select("id, domain, name, source, reason, created_at, categories:suggested_category_id (name_nl)", { count: "exact" })
    .eq("status", "new")
    .order("created_at")
    .limit(100)
    .returns<Candidate[]>();
  if (error) return <p className="text-sm text-red-600">Fout: {error.message}</p>;
  if (!data.length) return <p className="text-sm">Geen nieuwe kandidaten. De Shop Scout stelt elke ochtend nieuwe voor.</p>;

  return (
    <form action={decideCandidates} className="flex flex-col gap-4">
      <p className="text-sm">
        {count !== null && count > data.length ? `De eerste ${data.length} van ${count} kandidaten.` : `${data.length} kandidaten.`} Alles
        is aangevinkt. Wijs eerst losse domeinen af met de knop op hun regel, en keur daarna de rest in één keer goed. Goedgekeurde
        domeinen worden vannacht gecrawld en blijven concept tot de pipeline ze publiceert.
      </p>
      <ul className="flex flex-col divide-y border rounded-md">
        {data.map((c) => (
          <li key={c.id} className="flex gap-3 p-3 text-sm">
            <input type="checkbox" name="id" value={c.id} defaultChecked className="mt-1 h-5 w-5 shrink-0" aria-label={`Selecteer ${c.domain}`} />
            <div className="min-w-0">
              <a href={`https://${c.domain}`} target="_blank" rel="noreferrer nofollow" className="font-medium underline break-all">
                {c.domain}
              </a>
              <span className="text-muted-foreground"> · {c.name ?? "geen naam"} · {c.categories?.name_nl ?? "geen categorie"}</span>
              {/* reason is agent output: shown as text, never as HTML */}
              <p className="text-muted-foreground">{c.reason}</p>
              <Button type="submit" formAction={rejectCandidate} name="one" value={c.id} variant="outline" size="sm" className="mt-2">
                Alleen deze afwijzen
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <Button type="submit" name="decision" value="accepted">
          Goedkeuren
        </Button>
        <Button type="submit" name="decision" value="rejected" variant="outline">
          Afwijzen
        </Button>
      </div>
    </form>
  );
}

export default function CandidatesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Nieuwe webshops (G6)</h1>
      <Suspense fallback={<p className="text-sm">Laden...</p>}>
        <CandidateList />
      </Suspense>
    </div>
  );
}
