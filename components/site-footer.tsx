import Link from "next/link";
import { SITE } from "@/lib/site";

// Footer identity on every public page (CLAUDE.md section 7).
export function SiteFooter() {
  return (
    <footer className="w-full border-t text-xs py-8">
      <div className="max-w-3xl mx-auto px-4 flex flex-col gap-2">
        <div className="flex flex-wrap gap-4">
          <Link href="/over" className="underline">
            Over ons
          </Link>
          <a href={`mailto:${SITE.email}`} className="underline">
            {SITE.email}
          </a>
        </div>
        <p className="text-muted-foreground">
          {SITE.legalName ?? SITE.name}
          {SITE.kvk ? ` · KvK ${SITE.kvk}` : " · KvK-inschrijving in behandeling"}
          {SITE.address ? ` · ${SITE.address}` : ""}
        </p>
        <p className="text-muted-foreground">
          Wij ontvangen soms een vergoeding als je via onze links iets koopt. Dat heeft geen invloed op de score.
        </p>
      </div>
    </footer>
  );
}
