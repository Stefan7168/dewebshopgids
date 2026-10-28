import Link from "next/link";
import { SITE } from "@/lib/site";

// Footer identity on every public page (CLAUDE.md section 7).
export function SiteFooter() {
  return (
    <footer className="w-full border-t text-xs py-8">
      <div className="max-w-3xl mx-auto px-4 flex flex-col gap-2">
        <div className="flex flex-wrap gap-x-4">
          <Link href="/gids" className="inline-flex min-h-8 items-center underline">
            Webshopgids
          </Link>
          <Link href="/over" className="inline-flex min-h-8 items-center underline">
            Over ons
          </Link>
          <Link href="/hoe-wij-beoordelen" className="inline-flex min-h-8 items-center underline">
            Hoe wij beoordelen
          </Link>
          <Link href="/informatie-voor-webshops" className="inline-flex min-h-8 items-center underline">
            Voor webshops
          </Link>
          <Link href="/privacy" className="inline-flex min-h-8 items-center underline">
            Privacy
          </Link>
          <a href={`mailto:${SITE.email}`} className="inline-flex min-h-8 items-center underline">
            {SITE.email}
          </a>
        </div>
        <p className="text-muted-foreground">
          {SITE.legalName ?? SITE.name}
          {SITE.kvk ? ` · KvK ${SITE.kvk}` : " · KvK-inschrijving in behandeling"}
          {SITE.address ? ` · ${SITE.address}` : ""}
        </p>
        <p className="text-muted-foreground">
          Wij ontvangen soms een vergoeding als je via onze links iets koopt. Dat heeft geen invloed op de score of de volgorde.
        </p>
      </div>
    </footer>
  );
}
