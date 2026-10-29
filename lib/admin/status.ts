// /admin/status: one screen with what still blocks publishing. Reads only the database and whether
// env vars are present; never shows a value. Pure so it can be tested without a database.
import { SITE } from "@/lib/site";

export type Blocker = { key: string; label: string; ok: boolean; detail: string; href?: string };

export type StatusInput = {
  env: Record<string, string | undefined>;
  /** Latest agent_runs row per pipeline step (trigger = 'pipeline'), newest first. */
  pipelineRuns: { agent: string; status: string; started_at: string }[];
  emailsSent: number;
  prenoticeOn: boolean;
};

const has = (env: StatusInput["env"], k: string) => Boolean(env[k]?.trim());

export function launchBlockers({ env, pipelineRuns, emailsSent, prenoticeOn }: StatusInput): Blocker[] {
  const ran = pipelineRuns.length > 0;
  const scored = pipelineRuns.some((r) => r.agent === "score-collect" && r.status === "ok");
  const host = env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^www\./, "");
  const domainOk = host === SITE.domain;
  const stripe = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_BADGE_MONTH", "STRIPE_PRICE_BADGE_YEAR", "STRIPE_WEBHOOK_SECRET"].filter((k) => !has(env, k));
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
      detail: scored ? "er is een scorebatch opgehaald" : "nog geen scorebatch opgehaald (pas na de 2e nacht te zien)",
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
      ok: stripe.length === 0,
      detail: stripe.length ? `ontbreekt: ${stripe.join(", ")}` : "betalen staat aan",
    },
  ];
}

/** The steps of the most recent night: every pipeline run within 6 hours of the newest one. */
export function lastNight<T extends { started_at: string }>(runs: T[]): T[] {
  if (!runs.length) return [];
  const newest = Math.max(...runs.map((r) => Date.parse(r.started_at)));
  return runs.filter((r) => newest - Date.parse(r.started_at) <= 6 * 3600 * 1000).sort((a, b) => a.started_at.localeCompare(b.started_at));
}
