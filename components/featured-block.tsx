import Link from "next/link";
import { ScoreBadge } from "@/components/score-badge";
import type { PublicShop } from "@/lib/shops/present";

/** Paid placement, apart from the ranked list and labelled "Advertentie" (plan v3 sections 10 and 12). */
export function FeaturedBlock({ shops }: { shops: PublicShop[] }) {
  if (shops.length === 0) return null;
  return (
    <aside aria-label="Uitgelicht (advertentie)" className="flex flex-col gap-2 rounded-lg border border-dashed p-4">
      <p className="text-sm">
        <span className="font-semibold">Uitgelicht</span>{" "}
        <span className="rounded border px-1.5 py-0.5 text-xs text-muted-foreground">Advertentie</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Deze webshops betalen voor deze plek. Dat verandert niets aan hun score of hun plaats in de lijst hieronder.
      </p>
      <ul className="flex flex-col gap-2">
        {shops.map((s) => (
          <li key={s.id}>
            <Link href={`/webshop/${s.slug}`} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
              <ScoreBadge shop={s} />
              <span className="min-w-0">
                <span className="block font-semibold">{s.name}</span>
                <span className="block text-sm text-muted-foreground break-words">{s.domain}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
