import { Suspense } from "react";
import { GuideBody } from "@/components/guide-body";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { approveGuide } from "./actions";

type Issue = {
  id: string; slug: string; status: string; title_nl: string | null; intro_nl: string | null; body_md: string | null; shop_ids: string[];
  fact_check_report: { round?: number; code_findings?: string[]; agent_findings?: string[] } | null; approved_by: string | null;
};

const STATUS: Record<string, string> = {
  draft: "concept, nog niet gecontroleerd",
  rejected: "afgekeurd door de Fact Checker, wordt herschreven",
  fact_checked: "gecontroleerd, wacht op jouw goedkeuring",
  approved: "goedgekeurd, wordt donderdag 10:00 verstuurd",
  published: "gepubliceerd, geen mail",
  sent: "gepubliceerd en verstuurd",
  fallback: "vervangende pagina gepubliceerd, geen mail",
};

async function Issues() {
  await requireAdmin();
  const db = createServiceClient();
  const { data, error } = await db
    .from("guide_issues")
    .select("id, slug, status, title_nl, intro_nl, body_md, shop_ids, fact_check_report, approved_by")
    .order("slug", { ascending: false })
    .limit(6)
    .returns<Issue[]>();
  if (error) return <p className="text-sm text-red-600">Fout: {error.message}</p>;
  if (!data.length) return <p className="text-sm">Nog geen gids. Maandag 06:00 maakt de pipeline de eerste aan.</p>;
  // The shops block under the mail and the page, so the approval covers them too.
  const ids = [...new Set(data.flatMap((g) => g.shop_ids))];
  const { data: shopRows } = ids.length ? await db.from("shops").select("id, name, domain, score, status").in("id", ids) : { data: [] };
  const shopById = new Map((shopRows ?? []).map((s) => [s.id as string, s]));
  return (
    <ul className="flex flex-col gap-4">
      {data.map((g) => {
        const findings = [...(g.fact_check_report?.code_findings ?? []), ...(g.fact_check_report?.agent_findings ?? [])];
        return (
          <li key={g.id} className="border rounded-md p-4 flex flex-col gap-3 text-sm">
            <p>
              <strong>{g.slug}</strong> · {STATUS[g.status] ?? g.status}
              {g.fact_check_report?.round ? ` · controle ${g.fact_check_report.round}` : ""}
              {g.approved_by ? ` · goedgekeurd door ${g.approved_by}` : ""}
            </p>
            {findings.length ? (
              <ul className="list-disc pl-5 text-muted-foreground">{findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
            ) : null}
            {g.body_md ? (
              <div className="border-l-2 pl-3 flex flex-col gap-2">
                <p className="text-base font-semibold">{g.title_nl}</p>
                {g.intro_nl ? <p>{g.intro_nl}</p> : null}
                <GuideBody md={g.body_md} />
              </div>
            ) : null}
            {g.shop_ids.length ? (
              <div>
                <p className="font-medium">Webshops in deze gids</p>
                <ul className="list-disc pl-5">
                  {g.shop_ids.map((id) => {
                    const s = shopById.get(id);
                    return (
                      <li key={id}>
                        {s ? `${s.name} (${s.domain}) · score ${s.score ?? "geen"}` : "onbekende webshop"}
                        {s && s.status !== "published" ? <span className="text-red-700"> · niet gepubliceerd ({s.status})</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {g.status === "fact_checked" ? (
              <form action={approveGuide}>
                <input type="hidden" name="id" value={g.id} />
                <Button type="submit">Mail goedkeuren voor donderdag 10:00</Button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function GuideAdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Gids versturen (G2)</h1>
      <p className="text-sm text-muted-foreground">
        Lees de gecontroleerde gids en keur de mail goed. Zonder goedkeuring verschijnt de gids donderdag alleen op de site.
        Na 8 verstuurde gidsen zonder correctie kan G2 worden opgeheven.
      </p>
      <Suspense fallback={<p className="text-sm">Laden...</p>}>
        <Issues />
      </Suspense>
    </div>
  );
}
