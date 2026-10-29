import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { RankingDisclosure } from "@/components/ranking-disclosure";
import { ScoreBadge } from "@/components/score-badge";
import { keurmerkText, onlineSince, type PublicShop } from "@/lib/shops/present";
import { SITE } from "@/lib/site";

/** A ranked list: disclosure directly above, ItemList markup, no paid entries inside. */
export function ShopList({ shops, listName, disclosure }: { shops: PublicShop[]; listName: string; disclosure?: string[] }) {
  if (shops.length === 0) {
    return <p className="text-muted-foreground">Hier staan nog geen webshops. We voegen elke week nieuwe toe.</p>;
  }
  return (
    <section className="flex flex-col gap-3" aria-label={listName}>
      <RankingDisclosure lines={disclosure} />
      <ol className="flex flex-col gap-3">
        {shops.map((s) => {
          const since = onlineSince(s.domain_first_seen);
          return (
            <li key={s.id}>
              <Link href={`/webshop/${s.slug}`} className="flex gap-4 rounded-lg border p-4 hover:bg-muted">
                <ScoreBadge shop={s} />
                <div className="min-w-0 flex flex-col gap-1">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-sm text-muted-foreground break-words">{s.domain}</span>
                  {s.description_nl && <span className="text-sm line-clamp-2">{s.description_nl}</span>}
                  <span className="text-xs text-muted-foreground">
                    {[since ? `Online sinds ${since}` : null, s.keurmerk_status === "verified" ? keurmerkText(s).split(" (")[0] : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: listName,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: shops.length,
          itemListElement: shops.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE.url}/webshop/${s.slug}`,
            name: s.name,
          })),
        }}
      />
    </section>
  );
}
