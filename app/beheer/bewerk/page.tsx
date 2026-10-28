import type { Metadata } from "next";
import { Suspense } from "react";
import { DescriptionForm } from "@/components/claim-forms";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hashToken, isTokenShape } from "@/lib/newsletter/core";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Beschrijving aanpassen", robots: { index: false } };

type Search = Promise<{ t?: string }>;

async function Body({ searchParams }: { searchParams: Search }) {
  const { t } = await searchParams;
  if (!isTokenShape(t) || !process.env.SUPABASE_SERVICE_ROLE_KEY) return <p>Deze link klopt niet. Open de link uit je e-mail opnieuw.</p>;
  const db = createServiceClient();
  const { data: claim } = await db.from("shop_claims").select("shop_id, expires_at").eq("token_hash", hashToken(t)).maybeSingle();
  if (!claim || new Date(claim.expires_at) < new Date()) return <p>Deze link is verlopen. Vraag een nieuwe aan via de pagina van je webshop.</p>;
  const { data: shop } = await db.from("shops").select("name, description_nl").eq("id", claim.shop_id).single();
  const { data: open } = await db.from("shop_edits").select("description_nl").eq("shop_id", claim.shop_id).eq("status", "pending").maybeSingle();
  return (
    <>
      <p>
        Pas de beschrijving van <strong>{shop?.name}</strong> aan. We bekijken elke tekst voordat hij online komt; je score verandert er niet door.
      </p>
      {open && <p className="text-sm text-muted-foreground">Er ligt al een tekst van je ter controle. Stuur je een nieuwe, dan vervangt die de vorige.</p>}
      <DescriptionForm token={t} current={open?.description_nl ?? shop?.description_nl ?? ""} />
    </>
  );
}

export default function Page(props: { searchParams: Search }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Beschrijving aanpassen</h1>
        <Suspense>
          <Body {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
