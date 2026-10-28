# Decisions

Record every decision that deviates from or adds to the plan. Newest first. Format: date, decision, reason.

- 2026-10-28: Reviewer and label guard run on `pull_request_target`; the Reviewer checks out the PR head into `./pr-head` as data and has no shell besides `gh pr` commands. Reason: secrets live in the `production` environment bound to `main`; on `pull_request` a PR could rewrite the workflow and read them. The Reviewer also runs on `opened` (non-draft), since a PR opened ready never fires `ready_for_review`.
- 2026-10-28: The Developer agent uses the Claude GitHub App token (OIDC), not `GITHUB_TOKEN`. Reason: PRs opened with `GITHUB_TOKEN` do not trigger CI.
- 2026-10-28: `claude-code-action` pinned to commit `8c3fd98` (v1.0.264), above the 1.0.74 floor from CVE-2026-47751.
- 2026-10-28: npm instead of pnpm (plan section 13). Reason: the official starter ships npm and a lockfile; one less tool for agents.
- 2026-10-28: Supabase Auth login is limited to emails in `ADMIN_EMAILS`, and the starter's sign-up pages are removed. Reason: the site has no public accounts; only Stefan uses `/admin`.
- 2026-10-28: Basic Auth lives in `proxy.ts` (Next.js 16 replaced `middleware.ts` with `proxy.ts`). Public exemptions: `/over`, `/api/health`, `/api/revalidate`. Reason: plan task 1 check (401 on `/`, 200 on `/over`); health must stay reachable for the uptime monitor.
- 2026-10-28: Started from the official `vercel/next.js` `examples/with-supabase` starter, dependencies pinned to exact versions (Next 16.4.3, @supabase/ssr 0.12.7, @supabase/supabase-js 2.118.0). Reason: the starter uses `latest`, which makes builds non-reproducible for agents.
- 2026-10-28: Supabase project `dewebshopgids` in eu-central-1 (Frankfurt). Reason: EU data residency.
