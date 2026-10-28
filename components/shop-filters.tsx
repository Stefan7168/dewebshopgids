import Link from "next/link";
import { hasFilters, PRICE_FILTERS, toggleHref, type ShopFilters } from "@/lib/shops/filters";

const chip = (on: boolean) =>
  `rounded-full border px-3 py-2 text-sm ${on ? "bg-foreground text-background border-foreground" : "hover:bg-muted"}`;

/** Plain links, no client JS: each chip switches one filter. Filters never change the order. */
export function ShopFilterBar({
  path,
  filters,
  shown,
  total,
}: {
  path: string;
  filters: ShopFilters;
  shown: number;
  total: number;
}) {
  const toggles = [
    {
      key: "keurmerk",
      label: "Met gecontroleerd keurmerk",
      on: filters.keurmerk,
    },
    { key: "winkel", label: "Met fysieke winkel", on: filters.winkel },
    { key: "nl", label: "Verzendt vanuit Nederland", on: filters.nl },
  ] as const;
  return (
    <nav aria-label="Filters" className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {toggles.map((t) => (
          <Link
            key={t.key}
            href={toggleHref(path, filters, t.key)}
            className={chip(t.on)}
            aria-pressed={t.on}
            rel="nofollow"
          >
            {t.label}
          </Link>
        ))}
        {PRICE_FILTERS.map((p) => (
          <Link
            key={p.level}
            href={toggleHref(path, filters, "prijs", p.level)}
            className={chip(filters.prijs === p.level)}
            aria-pressed={filters.prijs === p.level}
            rel="nofollow"
          >
            {p.label}
          </Link>
        ))}
      </div>
      {hasFilters(filters) && (
        <p className="text-sm text-muted-foreground">
          {shown} van {total} webshops. Een filter verandert de volgorde niet.{" "}
          <Link href={path} className="underline">
            Wis filters
          </Link>
        </p>
      )}
    </nav>
  );
}
