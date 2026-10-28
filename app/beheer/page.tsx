import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClaimRequestForm } from "@/components/claim-forms";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CLAIMABLE_STATUSES } from "@/lib/claims/core";
import { SITE } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Je webshop beheren", robots: { index: false } };

type Search = Promise<{ shop?: string }>;

async function Body({ searchParams }: { searchParams: Search }) {
  const { shop: slug } = await searchParams;
  const shop =
    slug && /^[a-z0-9-]{1,100}$/.test(slug) && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (await createServiceClient().from("shops").select("slug, name, domain, status").eq("slug", slug).maybeSingle()).data
      : null;
  if (slug && (!shop || !CLAIMABLE_STATUSES.includes(shop.status))) {
    // Came from a shop page, so "open it via the shop page" would send them in a circle.
    return (
      <p>
        We kunnen deze pagina nu niet voor deze webshop openen. Mail je nieuwe beschrijving vanaf een adres op je eigen domein naar{" "}
        <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.
      </p>
    );
  }
  if (!shop) {
    return (
      <p>
        Open deze pagina via de pagina van je webshop: onderaan staat &ldquo;Is dit jouw webshop?&rdquo;. Of ga naar de{" "}
        <Link href="/" className="underline">
          homepage
        </Link>
        .
      </p>
    );
  }
  return (
    <>
      <p>
        Hoort <strong>{shop.name}</strong> ({shop.domain}) bij jou? Dan kun je zelf de beschrijving op je pagina aanpassen. We sturen een link naar een adres op {shop.domain}; na een korte controle staat je tekst online.
      </p>
      <p className="text-sm text-muted-foreground">
        Je score en je plaats in de lijsten veranderen hier niet door. Klopt er een gegeven niet? Gebruik dan{" "}
        <Link href={`/herbeoordeling?shop=${shop.slug}`} rel="nofollow" className="underline">
          herbeoordeling
        </Link>
        .
      </p>
      <ClaimRequestForm slug={shop.slug} domain={shop.domain} />
    </>
  );
}

export default function Page(props: { searchParams: Search }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Je webshop beheren</h1>
        <Suspense>
          <Body {...props} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
