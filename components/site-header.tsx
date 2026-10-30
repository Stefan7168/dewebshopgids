import Link from "next/link";
import { MenuCloser } from "@/components/menu-closer";
import { getGuides } from "@/lib/guide/data";
import { getCategories, getPublishedShops } from "@/lib/shops/data";
import { promotedRoots } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

const SHORT_NAME: Record<string, string> = { "tuin-buiten": "Tuin", "eten-drinken": "Eten", "sieraden-accessoires": "Sieraden" };
const LINK = "inline-flex min-h-11 items-center underline-offset-4 hover:underline";

export async function SiteHeader() {
  const [categories, shops, guides] = await Promise.all([getCategories(), getPublishedShops(), getGuides()]);
  const roots = promotedRoots(categories, shops);
  const items = [
    ...(roots.length === 0 ? [{ href: "/categorie/wonen", label: "Wonen" }] : roots.map((c) => ({ href: `/categorie/${c.slug}`, label: SHORT_NAME[c.slug] ?? c.name_nl }))),
    ...(guides.length ? [{ href: "/gids", label: "Gids" }] : []),
  ];
  return (
    <header className="w-full border-b">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
          {SITE.name}
        </Link>
        <nav aria-label="Hoofdmenu" className="flex items-center gap-4 text-sm">
          {/* Up to two items fit next to the name at 390 px; more go in a menu that needs no JavaScript. */}
          <div className={items.length > 2 ? "hidden sm:flex items-center gap-4" : "flex items-center gap-4"}>
            {items.map((i) => (
              <Link key={i.href} href={i.href} className={LINK}>
                {i.label}
              </Link>
            ))}
          </div>
          <Link href="/zoeken" className={LINK}>
            Zoeken
          </Link>
          {items.length > 2 && (
            <details data-menu className="relative sm:hidden">
              <MenuCloser />
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center underline-offset-4 hover:underline">Menu</summary>
              <ul className="absolute right-0 z-10 mt-1 flex min-w-40 flex-col rounded-md border bg-background p-2 shadow">
                {items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className={`${LINK} w-full px-2`}>
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </nav>
      </div>
    </header>
  );
}
