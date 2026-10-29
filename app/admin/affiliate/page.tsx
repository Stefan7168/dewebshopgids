import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import { setAffiliateUrl } from "./actions";

type Row = { id: string; name: string; domain: string; status: string; affiliate_url: string | null };

async function ShopList({ q }: { q: string }) {
  await requireAdmin();
  let query = createServiceClient()
    .from("shops")
    .select("id, name, domain, status, affiliate_url")
    .neq("status", "removed")
    .order("affiliate_url", { ascending: true, nullsFirst: false })
    .order("name")
    .limit(50);
  // Letters, digits, dots and dashes only, so the value cannot change the filter syntax.
  const term = q.toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 60);
  if (term) query = query.ilike("domain", `%${term}%`);
  const { data, error } = await query.returns<Row[]>();
  if (error) return <p className="text-sm text-red-600">Fout: {error.message}</p>;
  if (!data.length) return <p className="text-sm">Geen webshops gevonden.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {data.map((s) => (
        <li key={s.id} className="flex flex-col gap-2 rounded-md border p-3 text-sm">
          <p>
            <strong>{s.name}</strong> <span className="text-muted-foreground">· {s.domain} · {s.status}</span>
          </p>
          <form action={setAffiliateUrl} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={s.id} />
            <input
              name="url"
              type="url"
              defaultValue={s.affiliate_url ?? ""}
              placeholder="https://... (leeg = geen affiliatelink)"
              maxLength={2000}
              className="h-10 min-w-0 flex-1 rounded-md border px-2"
            />
            <Button type="submit">Opslaan</Button>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default async function AffiliatePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl">Affiliatelinks</h1>
      <p className="text-sm">
        Plak per webshop de link uit het Daisycon-dashboard. &quot;Naar de webshop&quot; gaat dan via die link. De volgorde en de score veranderen niet.
      </p>
      <form className="flex gap-2">
        <input name="q" placeholder="Zoek op domein" className="h-10 min-w-0 flex-1 rounded-md border px-2" />
        <Button type="submit" variant="outline">
          Zoeken
        </Button>
      </form>
      <Suspense fallback={<p className="text-sm">Laden...</p>}>
        <ShopListFromParams searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ShopListFromParams({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <ShopList q={q ?? ""} />;
}
