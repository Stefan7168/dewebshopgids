import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { approveDrafts, optOutShop, rejectDraft } from "./actions";

type Draft = { id: string; subject: string; body_md: string; created_at: string; shops: { name: string; domain: string; score: number | null } };

async function Drafts() {
  await requireAdmin();
  const db = createServiceClient();
  const [{ data, error }, { count: sent }] = await Promise.all([
    db
      .from("outreach_drafts")
      .select("id, subject, body_md, created_at, shops!inner(name, domain, score)")
      .eq("status", "draft")
      .order("created_at")
      .limit(30)
      .returns<Draft[]>(),
    db.from("outreach_drafts").select("id", { count: "exact", head: true }).in("status", ["queued", "sent"]),
  ]);
  if (error) return <p className="text-sm text-red-600">Fout: {error.message}</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {sent ?? 0} van de eerste 30 mails goedgekeurd. Daarna kan G3 voor badge-aanbod worden opgeheven.
      </p>
      {!data.length ? (
        <p className="text-sm">Geen concepten. De Outreach-agent schrijft ze op dinsdag 07:00.</p>
      ) : (
        <>
          <form action={approveDrafts}>
            {data.map((d) => (
              <input key={d.id} type="hidden" name="id" value={d.id} />
            ))}
            <Button type="submit">Alle {data.length} goedkeuren</Button>
          </form>
          <ul className="flex flex-col gap-4">
            {data.map((d) => (
              <li key={d.id} className="border rounded-md p-4 flex flex-col gap-3 text-sm">
                <p>
                  <strong>{d.shops.name}</strong> · {d.shops.domain} · score {d.shops.score ?? "?"}
                </p>
                <p className="font-semibold">{d.subject}</p>
                <pre className="whitespace-pre-wrap font-sans border-l-2 pl-3">{d.body_md}</pre>
                <p className="text-xs text-muted-foreground">
                  [betaallink] wordt de Stripe-betaallink, [shoppagina] de pagina van de shop. De afmeldregel komt er vast onder.
                </p>
                <div className="flex gap-2">
                  <form action={approveDrafts}>
                    <input type="hidden" name="id" value={d.id} />
                    <Button type="submit">Goedkeuren</Button>
                  </form>
                  <form action={rejectDraft}>
                    <input type="hidden" name="id" value={d.id} />
                    <Button type="submit" variant="outline">Afwijzen</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function OutreachAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl">Badge-aanbod (G3)</h1>
      <p className="text-sm text-muted-foreground">
        Concepten van de Outreach-agent. Code heeft de shops gekozen en de tekst gecontroleerd. Na goedkeuring gaat de mail naar het
        algemene adres van de shop.
      </p>
      <Suspense fallback={<p className="text-sm">Laden...</p>}>
        <Drafts />
      </Suspense>
      <section className="flex flex-col gap-2 text-sm">
        <h2 className="text-lg font-semibold">Shop wil geen mails meer</h2>
        <p className="text-muted-foreground">Antwoordde een shop met &quot;stop&quot;? Vul het domein in. Er gaat dan nooit meer een badge-aanbod naartoe.</p>
        <form action={optOutShop} className="flex gap-2">
          <input name="domain" required placeholder="voorbeeld.nl" className="h-10 min-w-0 flex-1 rounded-md border px-3" />
          <Button type="submit" variant="outline">Afmelden</Button>
        </form>
      </section>
    </div>
  );
}
