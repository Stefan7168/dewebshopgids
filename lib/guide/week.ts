// Week semantics of the gids (plan v3 section 2.6): the slug is the ISO week of the Thursday
// send; the data window is the previous ISO week, Monday 00:00 to Sunday 23:59 Amsterdam time.
const TZ = "Europe/Amsterdam";

/** Calendar date in Amsterdam as a UTC-midnight Date (only the Y-M-D part matters). */
export function amsterdamDate(now: Date): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** ISO 8601 week of a calendar date. */
export function isoWeek(day: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow); // the Thursday of this week decides the year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { year: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7) };
}

export function guideSlug(year: number, week: number): string {
  return `${year}-week-${String(week).padStart(2, "0")}`;
}

export function parseGuideSlug(slug: string): { year: number; week: number } | null {
  const m = slug.match(/^(\d{4})-week-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  return week >= 1 && week <= 53 ? { year, week } : null;
}

/** Monday (UTC-midnight date) of an ISO week. */
export function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
  return monday;
}

/** UTC instant of 00:00 Amsterdam time on a calendar date. */
export function amsterdamMidnight(day: Date): Date {
  const guess = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(guess));
  return new Date(guess.getTime() - hour * 3_600_000); // Amsterdam is UTC+1 or +2
}

/** The issue sent on the Thursday of this or the coming ISO week, as seen on `now`. */
export function issueForSendWeek(now: Date): { year: number; week: number; slug: string; windowStart: Date; windowEnd: Date } {
  const { year, week } = isoWeek(amsterdamDate(now));
  const monday = isoWeekMonday(year, week);
  const prevMonday = new Date(monday.getTime() - 7 * 86_400_000);
  return {
    year,
    week,
    slug: guideSlug(year, week),
    windowStart: amsterdamMidnight(prevMonday),
    windowEnd: amsterdamMidnight(monday), // exclusive
  };
}
