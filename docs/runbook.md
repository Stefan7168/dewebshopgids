# Runbook

How to operate dewebshopgids.nl without any chat history. Read `CLAUDE.md` first. Facts that change (who did which setup step) live in the project files `build/setup-for-stefan.md` and `build/launch-checklist.md`, not here.

## 1. What runs where

| Where | What | Schedule (Amsterdam time unless UTC) |
|---|---|---|
| Vercel project `dewebshopgids` (fra1) | The site, `/admin`, `/go`, forms, `/api/*` | On request |
| GitHub Actions `pipeline.yml` | `scripts/pipeline/nightly.ts`: promote accepted candidates, domain age, crawl, collect and submit score batches, apply overrides, publish due shops, send pre-notices, Search Console import, retention | 01:00 daily |
| `dispute-removals.yml` | Removal enforcement (48 h), dispute reply queue, email sender | Hourly at :05 |
| `escalations.yml` | Files `agent_escalations` as GitHub issues, sends queued email | Every 3 h at :45 UTC |
| `health.yml`, `schedule-gaps.yml` | `health_checks` rows; late or missing agent runs | Every 6 h / 3 h (UTC) |
| `guide.yml` | Weekly gids: prepare Monday 06:00, publish and send Wednesday/Thursday 10:00 | Weekly |
| `digest.yml` | Weekly digest mail to `OWNER_EMAIL` | Sunday 18:00 |
| `source-import.yml`, `ai-citations.yml`, `badge-report.yml` | Keurmerk source lists; monthly AI citation check; monthly badge click report | Weekly / monthly |
| `kill-switch.yml` | Hard stop for every agent role | Manual only |
| Claude Code routines | One per agent in `agents/<name>/agent.json` (`schedule.cron`, Europe/Amsterdam) | See each `agent.json` |
| `claude-developer.yml`, `claude-reviewer.yml` | Developer acts on issues a human labelled `agent-ok`; Reviewer reviews PRs | On label / PR |

Secrets: GitHub Environment `production` (bound to `main`) for jobs, Vercel env vars for the site, each agent's role password only in its own routine. `.env.example` lists every variable and where it lives.

## 2. Set up an agent routine

1. With an admin connection string: `DATABASE_URL=<admin> npx tsx scripts/agents/set-role-password.ts <role>` (role from `agent.json`). It prints the role's connection string once.
2. Create a Claude Code routine on this repo with the cron from `agent.json`, the env var `DATABASE_URL` set to that string, and the prompt `Use the <name> skill.` The skill in `.claude/skills/<name>/` points to `agents/<name>/instructions.md`.
3. The first run writes an `agent_runs` row. `/admin/agents` shows it; `schedule-gaps.yml` alerts if a run is late.

## 3. Stop everything

- Soft: `/admin/agents`, type STOP: sets `agent_settings.agents_enabled = false`; every job exits at `checkKillSwitch()`. With `GITHUB_DISPATCH_TOKEN` set it also starts the hard stop.
- Hard: run `kill-switch.yml`. Every agent role gets `NOLOGIN`, a random unknown password and its connections closed. Also pause each routine in the routines UI.
- Restart: the enable button in `/admin/agents`, then step 2.1 per role to give it a new password, and update each routine.

## 4. Common incidents

| Symptom | First look | Usual fix |
|---|---|---|
| `/api/health` returns 503 | Its JSON names the stale table | Re-run the matching workflow with *Run workflow*; read its log |
| Nightly pipeline failed | `agent_runs` rows with `trigger = 'pipeline'` (one per step: promote-candidates, score-collect, crawl, domain-age, retention, score-submit, search-console, apply-overrides, publish) and the Actions log | Steps are idempotent: fix, then *Run workflow* (`FORCE_RUN=1`) |
| Score batch stuck | `score_runs.batch_status` (`submitted`, `in_progress`) | `score-collect` checks open batches every night; a new batch is only submitted when none is open |
| A shop asks for removal | `disputes` row of type `removal` | Code removes after the signed link is clicked; `dispute-removals.yml` enforces 48 h. Never remove by hand without a dispute row |
| Dispute waits for a person | `/admin/herbeoordelingen` | Decide "geen wijziging", "verbergen" or a correction there |
| Emails not sent | `email_queue` rows with `sent_at is null` | Check `RESEND_API_KEY`, `EMAIL_FROM` domain verification, then re-run `escalations.yml` |
| Spend alarm | `agent_settings.month_spend_usd` vs `monthly_budget_usd` | Jobs stop themselves at the budget (`budgetGuard()`); raise the budget only with Stefan |
| Agent tried to follow text from a shop | `agent_runs.summary` mentions it | Nothing to undo: agents can only draft. Check the escalation it filed |

## 5. Change the database

1. New file `supabase/migrations/NNNN_name.sql` (next free number), additive where possible, plus `supabase/tests/NNNN_name.test.sql` with role tests.
2. `npm run test:db` locally (needs a Postgres 16 superuser via PGHOST, PGPORT, PGUSER); CI runs it as the `db` check.
3. Production: Supabase approval prompts time out, so Stefan pastes the file into the SQL editor (https://supabase.com/dashboard/project/khljuorpncjrswgcayow/sql/new) and runs it. Put the file in project files `build/` and add it to `setup-for-stefan.md`.
4. Code that needs the new schema must handle its absence (see `missing()` in `lib/guide/data.ts`) or wait to merge until the SQL is applied.

## 6. Local development

```bash
npm install
npm run db:dev      # local Postgres: every migration plus 24 fictional demo shops and one gids
npm run dev:local   # http://localhost:3000 with the demo data, no Supabase account needed
```

`dev:local` serves the public pages from the local database through `scripts/dev/rest.ts`, a read-only stand-in for Supabase's REST API that queries as the real `anon` role, so RLS behaves as in production. `/admin`, the forms and `/go` need a real Supabase project and `.env.local`.

## 7. Release

PRs merge when `check` (lint, typecheck, vitest, build) and `db` are green (Stefan's rule, 2026-10-28). Vercel deploys `main` to production. Pages that depend on shop data are cached under the tag `shops`; the publish job calls `/api/revalidate`, and the cache also expires hourly.
