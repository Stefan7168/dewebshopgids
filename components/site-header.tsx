import Link from "next/link";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { promotedRoots } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

const SHORT_NAME: Record<string, string> = { "tuin-buiten": "Tuin", "eten-drinken": "Eten" };

export async function SiteHeader() {
  const [categories, shops] = await Promise.all([getCategories(), getPublishedShops()]);
  const roots = promotedRoots(categories, shops);
  return (
    <header className="w-full border-b">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {roots.length === 0 ? (
            <Link href="/categorie/wonen" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              Wonen
            </Link>
          ) : (
            roots.map((c) => (
              <Link key={c.id} href={`/categorie/${c.slug}`} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                {SHORT_NAME[c.slug] ?? c.name_nl}
              </Link>
            ))
          )}
          <Link href="/zoeken" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Zoeken
          </Link>
        </nav>
      </div>
    </header>
  );
}
