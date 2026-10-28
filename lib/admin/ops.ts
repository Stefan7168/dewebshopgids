// Pure helpers for the /admin agents page (plan v3 section 15: kill switch, run log, gap view, unpause).

const AGENT_NAME = /^[a-z][a-z0-9-]{0,40}$/;

export function isAgentName(s: string): boolean {
  return AGENT_NAME.test(s);
}

export type Paused = { agent: string; until: string | null };

/**
 * Agents switched off in agent_settings. A Watchdog pause has `paused_until.<agent>`;
 * a disable without it is a human decision. Both can be switched back on from /admin.
 */
export function pausedAgents(settings: { key: string; value: unknown }[]): Paused[] {
  const until = new Map<string, string>();
  for (const s of settings) {
    if (s.key.startsWith("paused_until.") && typeof s.value === "string") until.set(s.key.slice("paused_until.".length), s.value);
  }
  return settings
    .filter((s) => s.key.startsWith("enabled.") && s.value === false)
    .map((s) => s.key.slice("enabled.".length))
    .filter(isAgentName)
    .sort()
    .map((agent) => ({ agent, until: until.get(agent) ?? null }));
}

export type ScheduleRow = { agent: string; cron: string; timezone: string; max_gap_minutes: number };
export type GapRow = ScheduleRow & { lastRun: string | null; late: boolean };

/** Same rule as scripts/ops/health.ts runGaps: never ran, or last start older than max_gap_minutes. */
export function scheduleGaps(schedule: ScheduleRow[], lastRuns: Map<string, string>, now: Date): GapRow[] {
  return schedule
    .map((s) => {
      const lastRun = lastRuns.get(s.agent) ?? null;
      const late = lastRun === null || now.getTime() - new Date(lastRun).getTime() > s.max_gap_minutes * 60_000;
      return { ...s, lastRun, late };
    })
    .sort((a, b) => Number(b.late) - Number(a.late) || a.agent.localeCompare(b.agent));
}

/** Starts .github/workflows/kill-switch.yml. Needs a token with Actions write on the repo. */
export async function dispatchKillSwitch(token: string | undefined, repo: string, get: typeof fetch = fetch): Promise<{ ok: boolean; note: string }> {
  if (!token) return { ok: false, note: "GITHUB_DISPATCH_TOKEN ontbreekt: start de workflow Kill switch zelf in GitHub Actions." };
  const res = await get(`https://api.github.com/repos/${repo}/actions/workflows/kill-switch.yml/dispatches`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
    body: JSON.stringify({ ref: "main" }),
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 204) return { ok: true, note: "Workflow Kill switch gestart." };
  return { ok: false, note: `GitHub gaf ${res.status}: start de workflow Kill switch zelf in GitHub Actions.` };
}

/** Amsterdam time, 24-hour clock, for admin tables. */
export function formatTime(iso: string | null): string {
  if (!iso) return "nooit";
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "short", timeStyle: "short", hourCycle: "h23" }).format(new Date(iso));
}
