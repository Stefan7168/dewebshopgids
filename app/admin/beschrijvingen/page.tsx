import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { descriptionProblem } from "@/lib/claims/core";
import { createServiceClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import { decideDescription } from "./actions";

type Proposal = {
  id: string;
  description_nl: string;
  created_at: string;
  shops: { name: string; slug: string; domain: string; description_nl: string | null } | null;
};

async function ProposalList() {
  await requireAdmin();
  const { data, error } = await createServiceClient()
    .from("shop_edits")
    .select("id, description_nl, created_at, shops:shop_id (name, slug, domain, description_nl)")
    .eq("status", "pending")
    .order("created_at")
    .limit(50)
    .returns<Proposal[]>();
  if (error) return <p className="text-sm text-red-600">Fout: {error.message}</p>;
  if (!data.length) return <p className="text-sm">Geen nieuwe beschrijvingen van webshops.</p>;

  return (
    <ul className="flex flex-col gap-4">
      {data.map((p) => {
        const problem = descriptionProblem(p.description_nl);
        return (
          <li key={p.id} className="flex flex-col gap-2 rounded-md border p-3 text-sm">
            <p>
              <strong>{p.shops?.name}</strong> <span className="text-muted-foreground">· {p.shops?.domain}</span>
            </p>
            {/* Both texts are shop input or model output: shown as text, never as HTML. */}
            <p className="text-muted-foreground">Nu: {p.shops?.description_nl ?? "geen beschrijving"}</p>
            <p>Voorstel: {p.description_nl}</p>
            <p className="text-xs text-muted-foreground">
              Controleer: geen persoonsnamen, geen beoordelingen, geen claims die we niet kunnen controleren. De score verandert niet.
            </p>
            {problem && <p className="text-xs text-red-700">Kan niet worden goedgekeurd: {problem}</p>}
            <form action={decideDescription} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={p.id} />
              <input name="note" placeholder="Notitie (optioneel, alleen intern)" maxLength={500} className="h-10 min-w-0 flex-1 rounded-md border px-2" />
              <Button type="submit" name="decision" value="approved" disabled={!!problem}>
                Plaatsen
              </Button>
              <Button type="submit" name="decision" value="rejected" variant="outline">
                Afwijzen
              </Button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

export default function DescriptionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Beschrijvingen van webshops</h1>
      <p className="text-sm">Webshops die hun adres op het eigen domein bevestigden, stellen hier hun eigen beschrijving voor.</p>
      <Suspense fallback={<p className="text-sm">Laden...</p>}>
        <ProposalList />
      </Suspense>
    </div>
  );
}
