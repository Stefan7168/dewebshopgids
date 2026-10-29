// /admin/status: one screen with what still blocks publishing. Reads only the database and whether
// env vars are present; never shows a value. Pure so it can be tested without a database.
import { checkoutConfig } from "@/lib/badge/pricing";
import { SITE } from "@/lib/site";

export type Blocker = { key: string; label: string; ok: boolean; detail: string; href?: string };

export type StatusInput = {
  env: Record<string, string | undefined>;
  /** Latest agent_runs row per pipeline step (trigger = 'pipeline'), newest first. */
  pipelineRuns: { agent: string; status: string; started_at: string }[];
  /** score-submit runs that really sent a batch ("submitted N shops ..."): only possible with a working Anthropic key. */
  batchesSubmitted: number;
  emailsSent: number;
  prenoticeOn: boolean;
};

const has = (env: StatusInput["env"], k: string) => Boolean(env[k]?.trim());

export function launchBlockers({ env, pipelineRuns, batchesSubmitted, emailsSent, prenoticeOn }: StatusInput): Blocker[] {
  const ran = pipelineRuns.length > 0;
  // score-collect is "ok" with "no open batch" even without a key, so only a submitted batch counts.
  const scored = batchesSubmitted > 0;
  const host = env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^www\./, "");
  const domainOk = host === SITE.domain;
  // Same test as the checkout itself (key and price id formats), plus the webhook secret.
  const stripeOk = checkoutConfig(env) !== null && has(env, "STRIPE_WEBHOOK_SECRET");
  return [
    {
      key: "service",
      label: "Vercel: SUPABASE_SERVICE_ROLE_KEY",
      ok: has(env, "SUPABASE_SERVICE_ROLE_KEY"),
      detail: has(env, "SUPABASE_SERVICE_ROLE_KEY") ? "aanwezig" : "ontbreekt: admin-acties en \"Naar de webshop\" werken niet",
    },
    {
      key: "pipeline",
      label: "GitHub: PIPELINE_DATABASE_URL",
      ok: ran,
      detail: ran ? "de nachtelijke run schrijft in de database" : "nog geen nachtelijke run in de database (sleutel ontbreekt of de run faalde vóór de database)",
    },
    {
      key: "anthropic",
      label: "GitHub: ANTHROPIC_API_KEY",
      ok: scored,
      detail: scored ? "er is een scorebatch ingediend" : "nog geen scorebatch ingediend (zichtbaar na de eerste nacht met gecrawlde shops)",
    },
    {
      key: "domain",
      label: `Domein ${SITE.domain} gekoppeld`,
      ok: domainOk,
      detail: domainOk ? "productie draait op het eigen domein" : `productie draait op ${host ?? "onbekend"}; webshops kunnen /herbeoordeling niet openen`,
    },
    {
      key: "resend",
      label: "Resend (GitHub: RESEND_API_KEY, EMAIL_FROM, OWNER_EMAIL)",
      ok: emailsSent > 0,
      detail: emailsSent > 0 ? `${emailsSent} mails verstuurd` : "nog geen mail verstuurd",
    },
    {
      key: "prenotice",
      label: "Vooraankondigingen aan",
      ok: prenoticeOn,
      detail: prenoticeOn ? "aan" : "uit: zonder dit wordt niets gepubliceerd",
      href: "/admin/agents",
    },
    {
      key: "stripe",
      label: "Stripe voor de badge",
      ok: stripeOk,
      detail: stripeOk
        ? "betalen staat aan"
        : "uit: STRIPE_SECRET_KEY (sk_/rk_), STRIPE_PRICE_BADGE_MONTH en _YEAR (price_) en STRIPE_WEBHOOK_SECRET nodig",
    },
  ];
}

/** The steps of the most recent night: every pipeline run within 6 hours of the newest one. */
export function lastNight<T extends { started_at: string }>(runs: T[]): T[] {
  if (!runs.length) return [];
  const newest = Math.max(...runs.map((r) => Date.parse(r.started_at)));
  return runs.filter((r) => newest - Date.parse(r.started_at) <= 6 * 3600 * 1000).sort((a, b) => a.started_at.localeCompare(b.started_at));
}

/** Newest run per agent from one query's rows (newest first). An agent with no row in the window shows as never run. */
export function latestPerAgent<T extends { agent: string; status: string; started_at: string }>(
  agents: string[],
  runsNewestFirst: T[],
): { agent: string; status: string | null; started_at: string | null }[] {
  const latest = new Map<string, T>();
  for (const r of runsNewestFirst) if (!latest.has(r.agent)) latest.set(r.agent, r);
  return agents.map((a) => ({ agent: a, status: latest.get(a)?.status ?? null, started_at: latest.get(a)?.started_at ?? null }));
}
