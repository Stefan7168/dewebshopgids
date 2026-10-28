# Decisions

Record every decision that deviates from or adds to the plan. Newest first. Format: date, decision, reason.

- 2026-10-28: npm instead of pnpm (plan section 13). Reason: the official starter ships npm and a lockfile; one less tool for agents.
- 2026-10-28: Supabase Auth login is limited to emails in `ADMIN_EMAILS`, and the starter's sign-up pages are removed. Reason: the site has no public accounts; only Stefan uses `/admin`.
- 2026-10-28: Basic Auth lives in `proxy.ts` (Next.js 16 replaced `middleware.ts` with `proxy.ts`). Public exemptions: `/over`, `/api/health`, `/api/revalidate`. Reason: plan task 1 check (401 on `/`, 200 on `/over`); health must stay reachable for the uptime monitor.
- 2026-10-28: Started from the official `vercel/next.js` `examples/with-supabase` starter, dependencies pinned to exact versions (Next 16.4.3, @supabase/ssr 0.12.7, @supabase/supabase-js 2.118.0). Reason: the starter uses `latest`, which makes builds non-reproducible for agents.
- 2026-10-28: Supabase project `dewebshopgids` in eu-central-1 (Frankfurt). Reason: EU data residency.
