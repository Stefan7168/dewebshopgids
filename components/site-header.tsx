import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="w-full border-b">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/categorie/wonen" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Wonen
          </Link>
          <Link href="/categorie/tuin-buiten" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Tuin
          </Link>
          <Link href="/zoeken" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            Zoeken
          </Link>
        </nav>
      </div>
    </header>
  );
}
