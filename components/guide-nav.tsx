import Link from "next/link";
import { getGuides } from "@/lib/guide/data";
import { guideNeighbours } from "@/lib/guide/neighbours";

/** "Vorige gids / Volgende gids" under an issue, so a reader can keep reading on a tablet without going back to the list. */
export async function GuideNav({ slug }: { slug: string }) {
  const { older, newer } = guideNeighbours(await getGuides(), slug);
  if (!older && !newer) return null;
  const label = (g: { iso_week: number; title_nl: string | null }) => g.title_nl ?? `Week ${g.iso_week}`;
  return (
    <nav aria-label="Andere gidsen" className="grid gap-3 sm:grid-cols-2">
      {older ? (
        <Link href={`/gids/${older.slug}`} className="flex min-h-11 flex-col rounded-lg border p-4 hover:bg-muted">
          <span className="text-sm text-muted-foreground">Vorige gids · week {older.iso_week}, {older.iso_year}</span>
          <span className="font-medium">{label(older)}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {newer && (
        <Link href={`/gids/${newer.slug}`} className="flex min-h-11 flex-col rounded-lg border p-4 hover:bg-muted sm:text-right">
          <span className="text-sm text-muted-foreground">Volgende gids · week {newer.iso_week}, {newer.iso_year}</span>
          <span className="font-medium">{label(newer)}</span>
        </Link>
      )}
    </nav>
  );
}
