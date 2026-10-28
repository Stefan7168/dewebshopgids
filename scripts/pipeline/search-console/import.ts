// Search Console import (plan v3 section 8, step 14): daily rows per date, page and query
// into `search_console_daily` for the SEO/Growth Analyst. Nightly pipeline step, pipeline role.
// Auth: a Google service account (JSON key in GSC_SERVICE_ACCOUNT_JSON) added as a user on the
// Search Console property. Without it the step reports "not configured" and does nothing.
// Search queries are untrusted data: stored as text, never followed.
// Docs: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
import { createSign } from "node:crypto";
import type { Sql } from "../../../agents/shared/audit";

export const LOOKBACK_DAYS = 5; // Search Console data lags 2 to 3 days; re-import the last few
const ROW_LIMIT = 25_000; // API maximum per request
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };
type Fetch = typeof fetch;
export type GscRow = { keys: [string, string, string]; clicks: number; impressions: number; ctr: number; position: number };

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

/** A signed JWT for the OAuth 2.0 service-account flow. */
export function serviceAccountJwt(sa: ServiceAccount, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri ?? "https://oauth2.googleapis.com/token", iat, exp: iat + 3600 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(sa.private_key);
  return `${head}.${claims}.${b64url(sig)}`;
}

async function accessToken(sa: ServiceAccount, f: Fetch): Promise<string> {
  const res = await f(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: serviceAccountJwt(sa) }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export function dateRange(now: Date): { startDate: string; endDate: string } {
  const day = (offset: number) => new Date(now.getTime() - offset * 86_400_000).toISOString().slice(0, 10);
  return { startDate: day(LOOKBACK_DAYS), endDate: day(1) };
}

/** All rows for the range, paged by startRow. */
export async function fetchRows(siteUrl: string, token: string, range: { startDate: string; endDate: string }, f: Fetch): Promise<GscRow[]> {
  const rows: GscRow[] = [];
  for (let startRow = 0; ; startRow += ROW_LIMIT) {
    const res = await f(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ ...range, dimensions: ["date", "page", "query"], rowLimit: ROW_LIMIT, startRow }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`searchAnalytics ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const page = ((await res.json()) as { rows?: GscRow[] }).rows ?? [];
    rows.push(...page);
    if (page.length < ROW_LIMIT) return rows;
  }
}

export async function importSearchConsole(sql: Sql, env: Record<string, string | undefined> = process.env, f: Fetch = fetch, now = new Date()): Promise<{ summary: string }> {
  const raw = env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) return { summary: "not configured (GSC_SERVICE_ACCOUNT_JSON missing)" };
  const siteUrl = env.GSC_SITE_URL || "sc-domain:dewebshopgids.nl";
  const range = dateRange(now);
  const rows = await fetchRows(siteUrl, await accessToken(JSON.parse(raw) as ServiceAccount, f), range, f);
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((r) => ({
      date: r.keys[0], page: r.keys[1].slice(0, 2000), query: r.keys[2].slice(0, 500),
      clicks: r.clicks, impressions: r.impressions, ctr: Math.round(r.ctr * 1e5) / 1e5, position: Math.round(r.position * 100) / 100,
    }));
    await sql`
      insert into public.search_console_daily ${sql(chunk)}
      on conflict (date, page, query) do update set clicks = excluded.clicks, impressions = excluded.impressions,
        ctr = excluded.ctr, position = excluded.position`;
  }
  return { summary: `imported ${rows.length} rows for ${range.startDate} to ${range.endDate}` };
}
