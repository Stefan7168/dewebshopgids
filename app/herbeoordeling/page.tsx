import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DisputeForm } from "@/components/dispute-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ANSWER_DAYS, disputableStatus, parseDisputeType } from "@/lib/disputes/core";
import { SITE } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Herbeoordeling aanvragen", robots: { index: false } };

type Search = Promise<{ shop?: string; type?: string }>;

async function Body({ searchParams }: { searchParams: Search }) {
  const { shop: slug, type } = await searchParams;
  const shop =
    slug && /^[a-z0-9-]{1,100}$/.test(slug) && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (await createServiceClient().from("shops").select("slug, name, domain, status").eq("slug", slug).maybeSingle()).data
      : null;
  if (slug && (!shop || !disputableStatus(shop.status))) {
    // Came from a shop page, so "open it via the shop page" would send them in a circle.
    return (
      <p>
        We kunnen dit formulier nu niet voor deze webshop openen. Mail je vraag naar{" "}
        <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a> met de naam van de webshop; we antwoorden binnen {ANSWER_DAYS} dagen.
      </p>
    );
  }
  if (!shop) {
    return (
      <p>
        Open dit formulier via de pagina van de webshop: onderaan staat &ldquo;Klopt er iets niet?&rdquo;. Lukt dat niet? Mail ons via het adres onderaan deze pagina. Of ga naar de <Link href="/" className="underline">homepage</Link>.
      </p>
    );
  }
  return (
    <>
      <p>
        Gaat het over <strong>{shop.name}</strong> ({shop.domain})? Na je verzoek staat de score direct op &ldquo;In beoordeling&rdquo;. We controleren je verzoek tegen wat we op de site van de webshop vonden en antwoorden binnen {ANSWER_DAYS} dagen.
      </p>
      <DisputeForm slug={shop.slug} domain={shop.domain} initialType={parseDisputeType(type) ?? "correction"} />
    </>
  );
}

export default function Page(props: { searchParams: Search }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Herbeoordeling of verwijdering aanvragen</h1>
        <Suspense>
          <Body {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
