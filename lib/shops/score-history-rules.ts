// "Scoreverloop" on a shop page (plan v3 section 10: score changes over time are one of the
// first-party data points). The nightly pipeline writes a `scores` row per scoring run; most
// runs give the same total, so only the runs where the total changed are shown.

export type ScoreRow = { total: number; score_version: string; created_at: string };
export type ScoreChange = { date: string; total: number; newMethod: boolean };

export const MAX_CHANGES_SHOWN = 6;

/**
 * Rows oldest first in, changes newest first out. Empty when the score never changed, or when
 * the newest row does not match the score on the page (then the history would contradict it).
 */
export function scoreChanges(rows: ScoreRow[], currentScore: number): ScoreChange[] {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (sorted.length === 0 || sorted[sorted.length - 1].total !== currentScore) return [];
  const changes: ScoreChange[] = [];
  let prev: ScoreRow | undefined;
  for (const r of sorted) {
    if (!prev || r.total !== prev.total) {
      changes.push({ date: r.created_at, total: r.total, newMethod: prev !== undefined && r.score_version !== prev.score_version });
    }
    prev = r;
  }
  if (changes.length < 2) return [];
  return changes.reverse().slice(0, MAX_CHANGES_SHOWN);
}

/** "29 oktober 2026", in Dutch, Amsterdam time. */
export function dutchDate(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date(iso));
}
