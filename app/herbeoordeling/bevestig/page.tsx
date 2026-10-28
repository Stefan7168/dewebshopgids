import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TokenAction } from "@/app/nieuwsbrief/token-action";
import { confirmRemoval } from "../actions";

export const metadata: Metadata = { title: "Verzoek bevestigen", robots: { index: false } };

async function Body({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  if (!t) return <p>Deze link is niet compleet. Open de link uit je e-mail opnieuw.</p>;
  return (
    <>
      <p>Na je bevestiging halen we de pagina van de webshop direct offline.</p>
      <TokenAction token={t} label="Bevestig mijn verzoek" action={confirmRemoval} />
    </>
  );
}

export default function Page(props: { searchParams: Promise<{ t?: string }> }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Verzoek bevestigen</h1>
        <Suspense>
          <Body {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
