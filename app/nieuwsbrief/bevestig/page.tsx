import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { confirm } from "../actions";
import { TokenAction } from "../token-action";

export const metadata: Metadata = { title: "Inschrijving bevestigen", robots: { index: false } };

async function Body({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  if (!t) return <p>Deze link is niet compleet. Open de link uit je e-mail opnieuw.</p>;
  return <TokenAction token={t} label="Bevestig mijn inschrijving" action={confirm} />;
}

export default function Page(props: { searchParams: Promise<{ t?: string }> }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Inschrijving bevestigen</h1>
        <Suspense>
          <Body {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
