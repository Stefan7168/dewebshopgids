import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { SITE } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/service";
import { approvePins, rejectPins } from "./actions";

type Pin = { id: string; target_path: string; title: string; description: string; board: string; created_at: string };

async function Pins() {
  await requireAdmin();
  const db = createServiceClient();
  const [{ data, error }, { count: posted }, { count: waiting }] = await Promise.all([
    db.from("pin_drafts").select("id, target_path, title, description, board, created_at").eq("status", "draft").order("created_at").limit(30).returns<Pin[]>(),
    db.from("pin_drafts").select("id", { count: "exact", head: true }).eq("status", "posted"),
    db.from("pin_drafts").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);
  if (error) return <p className="text-sm text-red-600">Fout: {error.message}</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {posted ?? 0} van de eerste 100 pins geplaatst; G3 voor pins vervalt daarna. {waiting ?? 0} goedgekeurd en wachtend op plaatsing.
      </p>
      {!data.length ? (
        <p className="text-sm">Geen concepten. De SEO/Growth-agent schrijft ze op maandag 07:00.</p>
      ) : (
        <>
          <form action={approvePins}>
            {data.map((p) => (
              <input key={p.id} type="hidden" name="id" value={p.id} />
            ))}
            <Button type="submit">Alle {data.length} goedkeuren</Button>
          </form>
          <ul className="flex flex-col gap-4">
            {data.map((p) => (
              <li key={p.id} className="border rounded-md p-4 flex flex-col gap-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  Bord {p.board} · naar{" "}
                  <a href={`${SITE.url}${p.target_path}`} className="underline break-all">
                    {p.target_path}
                  </a>
                </p>
                <p className="font-semibold">{p.title}</p>
                <p>{p.description}</p>
                <div className="flex gap-2">
                  <form action={approvePins}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit">Goedkeuren</Button>
                  </form>
                  <form action={rejectPins}>
                    <input type="hidden" name="id" value={p.id} />
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

export default function PinsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl">Pinterest-pins (G3)</h1>
      <p className="text-sm text-muted-foreground">
        Concepten van de SEO/Growth-agent. Elke pin linkt naar een pagina van ons, nooit direct naar een webshop. Niet beoordeelde concepten
        vervallen na 7 dagen. Plaatsen gebeurt pas als de Pinterest-app is gekoppeld.
      </p>
      <Suspense fallback={<p className="text-sm">Laden...</p>}>
        <Pins />
      </Suspense>
    </div>
  );
}
