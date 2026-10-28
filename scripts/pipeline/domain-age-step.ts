// Domain age step (plan v3 section 8, step 6). Runs as the `pipeline` role.
// SIDN WHOIS for .nl domains (max 1 per 10 s, stop on the rate-limit answer) and
// the Wayback first capture (own limiter; 429 stops the step until next night).
import type { Sql } from "../../agents/shared/audit";
import { combineDomainAge, isSidnRateLimited, parseSidnCreationDate, whoisNl } from "./extract/domain-age";
import { createWaybackClient, WaybackRateLimited } from "./wayback";

export const MAX_DOMAINS_PER_NIGHT = 30;
const WHOIS_INTERVAL_MS = 10_000;

export type DomainAgeDeps = {
  whois?: (domain: string) => Promise<string>;
  firstCapture?: (domain: string) => Promise<Date | null>;
  sleep?: (ms: number) => Promise<void>;
};

export async function runDomainAge(sql: Sql, deps: DomainAgeDeps = {}): Promise<{ summary: string }> {
  const whois = deps.whois ?? whoisNl;
  const firstCapture = deps.firstCapture ?? createWaybackClient().firstCapture;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  const shops = await sql<{ id: string; domain: string }[]>`
    select id, domain from public.shops
    where status not in ('removed', 'disputed') and domain_age_sources = '{}'::jsonb
    order by created_at limit ${MAX_DOMAINS_PER_NIGHT}`;

  let done = 0;
  let whoisBlocked = false;
  let stop = "";
  for (const [i, s] of shops.entries()) {
    let whoisDate: Date | null = null;
    if (s.domain.endsWith(".nl") && !whoisBlocked) {
      if (i > 0) await sleep(WHOIS_INTERVAL_MS);
      try {
        const raw = await whois(s.domain);
        if (isSidnRateLimited(raw)) whoisBlocked = true;
        else whoisDate = parseSidnCreationDate(raw);
      } catch {
        // WHOIS down: keep the Wayback date and retry WHOIS on a later night.
      }
    }
    let wayback: Date | null;
    try {
      wayback = await firstCapture(s.domain);
    } catch (err) {
      stop = err instanceof WaybackRateLimited ? "Wayback rate limited" : `Wayback error: ${String(err)}`;
      break;
    }
    const age = combineDomainAge(whoisDate, wayback);
    // Without a WHOIS answer for a .nl domain, store nothing so the shop is retried.
    if (s.domain.endsWith(".nl") && !whoisDate) continue;
    await sql`
      update public.shops set
        domain_first_seen = ${age.show ? age.domain_first_seen : null},
        domain_age_sources = ${sql.json({ ...age.sources, agree: age.show })}
      where id = ${s.id}`;
    done++;
  }
  const notes = [`domain age for ${done} of ${shops.length} shops`];
  if (whoisBlocked) notes.push("SIDN WHOIS limit reached");
  if (stop) notes.push(stop);
  return { summary: notes.join(", ") };
}
