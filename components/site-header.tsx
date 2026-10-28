import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="w-full border-b">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          {SITE.name}
        </Link>
        <Link href="/categorie/wonen" className="text-sm underline-offset-4 hover:underline">
          Wonen &amp; interieur
        </Link>
      </div>
    </header>
  );
}
