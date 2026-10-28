import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { ShopList } from "@/components/shop-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { signupHeadline } from "@/lib/newsletter/core";
import { promotedRoots, rankShops, shopsInCategory } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

const TOP_N = 10;

export default async function Home() {
  const [categories, shops] = await Promise.all([getCategories(), getPublishedShops()]);
  const roots = promotedRoots(categories, shops);
  const withGarden = roots.some((c) => c.slug === "tuin-buiten");
  const top = rankShops(shops).slice(0, TOP_N);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold">{withGarden ? "Unieke en betrouwbare webshops voor huis en tuin" : "Unieke en betrouwbare woonwinkels"}</h1>
          <p className="text-lg">
            Nederlandse webshops voor {withGarden ? "wonen, interieur en tuin" : "wonen en interieur"}, gecontroleerd op feiten: hoe lang ze online zijn, hoeveel producten ze
            hebben, welk keurmerk ze echt hebben, en een echtheidsscore van 1 tot 100.
          </p>
          <p className="text-sm text-muted-foreground">
            Elke score rekenen we uit met een vast model op basis van wat letterlijk op de site staat.{" "}
            <Link href="/over" className="underline">Over ons</Link>
          </p>
        </section>
        {roots.map((root) => {
          const subs = categories.filter((c) => c.parent_id === root.id);
          if (subs.length === 0) return null;
          return (
            <section key={root.id} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">
                <Link href={`/categorie/${root.slug}`} className="hover:underline">
                  {root.name_nl}
                </Link>
              </h2>
              <ul className="grid grid-cols-2 gap-2">
                {subs.map((c) => (
                  <li key={c.id}>
                    <Link href={`/categorie/${c.slug}`} className="flex h-full flex-col rounded-lg border p-3 hover:bg-muted">
                      <span className="font-medium">{c.name_nl}</span>
                      <span className="text-xs text-muted-foreground">{shopsInCategory(shops, c, categories).length} webshops</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Hoogste echtheidsscore</h2>
          <ShopList shops={top} listName="Webshops met de hoogste echtheidsscore" />
        </section>
        <NewsletterForm headline={signupHeadline()} source="/" />
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", name: SITE.name, url: `${SITE.url}/`, inLanguage: "nl-NL" },
            { "@type": "Organization", name: SITE.legalName ?? SITE.name, url: `${SITE.url}/`, email: SITE.email },
          ],
        }}
      />
    </div>
  );
}
