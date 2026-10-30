// The issue before and after a gids issue, for the "vorige / volgende" links under it.
import type { PublicGuide } from "./data";

type Ref = Pick<PublicGuide, "slug" | "iso_year" | "iso_week" | "title_nl">;
const key = (g: Ref) => g.iso_year * 100 + g.iso_week;

export function guideNeighbours<T extends Ref>(guides: T[], slug: string): { older: T | null; newer: T | null } {
  const sorted = [...guides].sort((a, b) => key(a) - key(b));
  const i = sorted.findIndex((g) => g.slug === slug);
  if (i === -1) return { older: null, newer: null };
  return { older: sorted[i - 1] ?? null, newer: sorted[i + 1] ?? null };
}
