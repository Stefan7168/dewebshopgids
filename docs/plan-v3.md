# dewebshopgids.nl: Product Development Plan (v3, agent-maintained)

Summary: build the smallest site that proves Dutch Home & Living buyers click through to "uniek en betrouwbaar" webshops, then let a roster of agents run it. Vercel Pro from week 2, Supabase EU, a nightly TypeScript pipeline with two-step Claude Haiku batch scoring, verified evidence for every published signal, and a legal layer (ranking disclosure, GDPR notice, pre-notice email to shops) built in from the start. Deterministic work stays plain code. Judgment, writing and code changes go to named agents that run as Claude Code routines or through `claude-code-action`, each with its own least-privilege Postgres login role, an audit row per run, a hard kill switch that lives outside the agent, and a cost cap. No routine has GitHub or web access; agents write rows, code files issues and PRs. The webshop guide is weekly, rendered at `/gids/[yyyy]-week-[ww]` and sent on Thursdays. Stefan does one-time legal and account setup, taps a small number of approval gates, and reads a weekly digest. Each gate has a written exit criterion and a time-boxed safe default. Affiliate first, a direct "Geverifieerd" badge fee for makers from week 14, paid placement later. Money target: EUR 150 approved commission per month by week 52. First bank payout is expected around month 6.

## 1. Goal and success metrics

North-star (12 months): **EUR 150 approved affiliate commission per month by week 52.** Chain assumption: 6% commission on a EUR 150 basket is EUR 9 per sale ([Meubella campaign, 6%](https://daisycon.com/nl/campagnes/19319-meubella-nl)), so 17 sales per month; at 1.5% conversion that is about 1,100 commission-capable outbound clicks; at 12% CTR about 9,000 shop-page sessions. The implied EPC is EUR 0.135 per commission-capable click (about EUR 13.50 per 100 clicks). Track the chain: sessions, outbound clicks, commission-capable share of clicks, EPC per sub-category, pending and approved sales. The SEO/Growth Analyst agent re-forecasts monthly with real Daisycon EPC against this figure and files the result as an `agent-proposed` issue.

Second goal (operations): **the site runs for 4 consecutive weeks with zero founder actions other than approval taps**, measured in `agent_runs` and `/admin`.

| Phase | Leading indicators | Target |
|---|---|---|
| 0 | Test click in `clicks` via `/go/`; first `agent_runs` row from the Developer agent; Reviewer approval counts toward the required review | 1; 1; yes |
| 1 | Shops audited by Score Auditor; MAE pipeline vs auditor on held-out shops; agent PRs merged; Shop Scout candidates accepted via G6 | 60; MAE under 12; 10; 60 |
| 2 | Sitemap accepted; share of submitted URLs indexed in 30 days (Analyst, from Search Console API table); CTR on organic shop-page sessions; disputes answered within 7 days by agent; G6 candidates accepted | yes; 50%; 500 sessions; 100%; 30 |
| 3 | Pending Daisycon transactions; confirmed subscribers; weekly guides published on time; fact-check corrections per guide; cost per subscriber in best test; green nightly runs | 3; 300; 8 of 8; under 2; under EUR 3; 14 in a row |
| 4 | First approved commission (week 22); organic sessions per month; EPC per commission-capable click; weeks with zero founder actions; gates | EUR 1; 9,000; EUR 0.13 (about EUR 13 per 100 clicks); 4; G2 and G3 removed, G1 relaxed to auto-merge for small app PRs |

## 2. Assumptions for open decisions

1. **Scoring rubric.** Six signals, 100 points, computed in TypeScript. Maker: own brand or production (30). Focus: niche depth (20). Identity: booleans only, `has_named_owner`, `has_address`, `has_kvk` (20). Scale: 20 points under 300 products, linear to 0 at 5,000 (20). Origin claims: made in NL/EU, handmade, own atelier (10). Keurmerk and domain age are floors and caps: a verified keurmerk sets a minimum total of 25; a confirmed marketplace or dropship pattern caps Maker at 5 and the total at 30. Reason: bol.com also has age and a keurmerk; weights there would distort the score.
2. **Single score plus sub-scores.** One number in lists. The shop page shows sub-scores with a quoted evidence sentence, only for points earned. Reason: one number sorts; positive-only evidence limits defamation exposure.
3. **Profile fields.** Name, domain, category, platform, product count, domain first seen, keurmerk, score, sub-scores, 40-word description, affiliate URL, `affiliate_available`, `price_level` (1-4), `has_physical_store`, `store_city`, `ships_from_country`. No reviews, no owner name, no address text. Internal only, never shown: `contact_email` (a role address on the shop's own domain, used for pre-notice and outreach).
4. **Profile claiming.** Not in MVP. Phase 4 (week 30+). Reason: needs moderation and auth; the Dispute Handler agent moderates it later.
5. **Money model order.** Affiliate (Daisycon) from approval; flat EUR 19 per month "Geverifieerd" badge for non-affiliate makers from week 14; "Uitgelicht" advertisement block from week 22; claiming from week 30; gids sponsor after 3,000 subscribers.
6. **Gids format.** Weekly email via Resend Broadcasts, rendered at `/gids/[yyyy]-week-[ww]`, index at `/gids`. Week semantics: the slug is the ISO week of the Thursday send; the data window is the previous ISO week (Monday 00:00 to Sunday 23:59 Europe/Amsterdam). `guide_inputs` fills up to 5 shops in this order: newly published in the window, then biggest score rise, then most clicked shops never featured before. Drafted by the Guide Editor agent from database data only, checked by the Fact Checker agent, sent Thursday 10:00 Europe/Amsterdam. Email links only to own `/webshop/` and `/gids/` pages, never to `/go/` or affiliate URLs, so only the website is registered as Daisycon media ([Daisycon terms art. 2.14](https://daisycon.com/wp-content/uploads/2026/08/General-Terms-and-Conditions-for-Publisher-version-14.pdf)). No PDF. Roughly 4.3 sends per month. Until the first guide (week 13) the sign-up copy reads "Vanaf [maand]: elke week 5 unieke woonwinkels in je inbox" and a code-generated welcome email sends the current top 5 by clicks.
7. **Agent platform.** Scheduled judgment agents run as Claude Code routines (schedule triggers, fresh VM per run, no memory between runs, draws on the Claude subscription, account cap 100 runs per hour, research preview; connectors run without approval; [routines guide](https://makerkit.dev/blog/tutorials/claude-code-routines-guide)). Routines get exactly one connector: their own Supabase login role. No GitHub, no web. Event-driven code agents run through [`anthropics/claude-code-action`](https://www.morphllm.com/claude-code-github-actions) with an `ANTHROPIC_API_KEY` secret, pinned to a release at or above 1.0.74 ([CVE-2026-47751](https://app.opencve.io/cve/CVE-2026-47751)) and updated on every advisory; `allowed_non_write_users` is never set. Deterministic jobs stay plain GitHub Actions code. Fallbacks, in order: move a routine to `claude-code-action` on a cron; then [Claude Managed Agents](https://claude.com/blog/building-with-claude-managed-agents) at token rates plus USD 0.08 per session-hour. Vercel eve is not used now; agent instructions live in the repo as `instructions.md` plus Markdown skills plus TypeScript tools so they can move to eve later without rewriting.

## 3. Agent roster

Principles: code for anything deterministic (crawl, scoring maths, publish, email queue, deadlines, health checks, list imports, issue filing). Agents for judgment, writing and code changes. Every agent writes drafts, queues, escalation rows or PRs, never published rows directly; publication goes through the publish code path. Every run writes one `agent_runs` row; a plain code job checks that runs happen on schedule, because a run that never starts writes no row. Agents escalate by inserting into `agent_escalations`; a code job turns those rows into GitHub issues labelled `agent-proposed`. Only a human may apply `agent-ok`.

| Agent | Job | Trigger / schedule (Europe/Amsterdam) | Runs on | May write | Guardrail | Approval gate |
|---|---|---|---|---|---|---|
| Developer | Turns a GitHub issue labelled `agent-ok` (by a human) into a PR with tests | Issue labelled `agent-ok`; `@claude` mention by a human | claude-code-action | Branches `claude/*`, PRs | `--max-turns 40`, `timeout-minutes 30`, one issue per PR, under 400 lines, no secrets in context, never receives crawl text or emails | Human merge for app code (gate G1) |
| Reviewer | Reviews every PR: correctness, RLS, legal rules in CLAUDE.md, size | PR `ready_for_review` or `labeled`, not every push | claude-code-action under its own GitHub App | Review comments and approvals, label `needs-human` | Approval is advisory for CODEOWNERS paths; cannot set `auto-merge-ok` (code does); reads CI screenshot artifacts, not a live site | None |
| Shop Scout | Picks candidate Home & Living shops from imported source lists, dedupes, queues them | Daily 06:00 (from week 3) | Routine | `shop_candidates` (insert) | Reads only DB tables `source_lists` (code imports Thuiswinkel members and the Daisycon programme list weekly); no web; max 25 candidates per day | G6 batch tap before any candidate enters the pipeline |
| Score Auditor | Independent second scoring with a stronger model and a different prompt; samples; drift; escalates hard cases; proposes tuning changes in phase 1 | Daily, starts when today's `score_runs` row is `ok` (retry hourly, max 3) | Routine | `score_checks` (insert), `shops.status` between `draft` and `hidden` only, `agent_escalations` | Reads crawl text as untrusted data; never edits `scores`; RLS `WITH CHECK` limits status values | None; disputes over 20 points escalate to G4 |
| Dispute Handler | Reads disputes, verifies claims against evidence, picks reply templates, drafts corrections | Every 6 hours, only when code finds `disputes.status = open` | Routine | `disputes.status`, `disputes.resolved_note`, `disputes.reply_template_id`, `disputes.reply_slots`, `score_overrides` (draft) | Removal and objection are handled by code; replies are templates with typed slots; free text goes only to `resolved_note`; sender domain is confirmed by signed link, not by string compare | Score-changing correction or re-publication after removal (G4) |
| Guide Editor | Drafts the weekly guide from DB data only | Monday 06:30 after `guide_inputs` refresh; redraft Tuesday and Wednesday 03:00 if rejected | Routine (`agent_guide`) | `guide_issues` draft columns only (`title_nl`, `intro_nl`, `body_md`, `shop_ids`) | Allowed input is the fixed SQL view `guide_inputs` plus `fact_check_report`; no web; no new claims; cannot change `status` | Send tap for the first 8 issues (G2) |
| Fact Checker | Checks every number, name and claim in the draft against `guide_inputs` | Monday 08:00; after each redraft | Routine (`agent_factcheck`) | `guide_issues.fact_check_report`, `guide_issues.status` to `fact_checked` or `rejected` only | Different prompt and model from the Editor; separate role; rejects on any unmatched claim; cannot edit `body_md` | None |
| Publisher/Sender | Publishes the guide page, creates and sends the Resend Broadcast, publishes shops after pre-notice, publishes the fallback page | Thursday 10:00 local (cron at 08:00 and 09:00 UTC, exits unless local time is 10:00); nightly | Actions code | `shops.status=published`, `guide_issues.sent_at`, Resend | Code, not an agent; refuses if status is not `fact_checked` (or `approved` while G2 is active) | G2 while active |
| Outreach | Drafts badge and Uitgelicht sales emails and follow-ups to shops scoring 70+ with clicks and no affiliate programme | Weekly Tuesday 07:00 | Routine | `outreach_drafts` | Pre-notice is code; sales emails are drafts; one email per shop per 90 days; shop email text treated as untrusted; inserts only the fixed Stripe Payment Link | Batch tap for the first 30 emails (G3) |
| SEO/Growth Analyst | Reads `search_console_daily` and PostHog export tables; files escalations for indexation drops, thin pages, CTR changes, ad test readouts; drafts Pinterest pins | Weekly Monday 07:00; monthly forecast | Routine (`agent_analyst`) | `agent_escalations`, `pin_drafts` | Read-only on all other tables; max 5 escalations per week; search queries and referrers are untrusted data | Spend decisions (G5); pin batches under G3 |
| Ops Watchdog | Reads `health_checks` written by code, summarises failures, token spend and screenshots, writes the digest summary | Every 6 hours only when a code check failed; Sunday 17:00 for the digest | Routine (`agent_ops`) | `agent_settings` (may only set `enabled.<agent>=false` with `paused_until`), `email_queue` (pause alert, digest summary), `agent_escalations` | Can pause agents, never unpause; a pause expires after 48 hours if checks are green; no web (code checks `/api/health`, Vercel status and Supabase status) | None |

Workload for Stefan after phase 2: gates G1 to G6 (a few taps per week in `/admin` or GitHub), one digest email per week, unpausing an agent after a Watchdog pause (one tap from the alert email), and rare legal letters. Nothing in the roster waits on his hours: every gate has a safe, time-boxed default when nobody taps.

## 4. Approval gates and exit criteria

| Gate | What needs a human | Why | Default if nobody taps | Removed when |
|---|---|---|---|---|
| G1 App-code merge and `agent-ok` label | Merge of PRs touching `app/`, `components/`, `lib/`, `middleware.ts` (enforced by CODEOWNERS); relabelling `agent-proposed` issues to `agent-ok` | A bad deploy can break `/go/` revenue or leak draft rows; an agent-to-agent chain must not reach production unseen | PR or issue waits; Vercel preview stays up | 8 consecutive weeks in which every agent PR passed CI and review with zero incidents (defined in `DECISIONS.md`); then auto-merge for PRs under 200 lines. `supabase/migrations/`, `lib/scoring/`, `.github/`, `.claude/`, `agents/` stay human-merge for the whole year; `agent-ok` stays human-only for the whole year |
| G2 Guide send | One tap in `/admin` on a fact-checked guide | Email reaches subscribers and cannot be recalled | Page publishes on the site Thursday 10:00; the email is skipped that week | 8 issues sent with zero post-send corrections |
| G3 Outbound content batch | One tap per weekly batch of drafted sales emails; one tap per weekly Pinterest pin batch | Unsolicited commercial email in NL is regulated; brand voice; public posts from data an agent read | Batch waits 7 days, then expires | Emails: 30 sent with zero complaints (Resend `email.complained` webhook or opt-out reply) and at least 1 reply. Pins: 100 posted with zero `needs-human` issues about them |
| G4 Score-changing disputes | Corrections that change a published score by more than 10 points, or re-publication after a removal | The publisher carries defamation liability | After 7 days untouched, code applies the agent's proposed override if it lowers the score or hides the shop; otherwise code sets `hidden` (facts stay, score withdrawn) and sends the template "nog in beoordeling" email. Re-publication always needs the tap. The item stays in `/admin` | After 20 handled disputes where the human tap agreed with the agent's proposal, raise threshold to 20 points; never fully removed |
| G5 Money | Ad budget changes, plan upgrades, Stripe price changes and refunds, new paid tools | Spend | Nothing is spent. Pre-approved now: Resend marketing upgrade to USD 40 per month when confirmed subscribers reach 950 (Watchdog files the item at 900) | Never removed |
| G6 New domains | Weekly batch tap in `/admin` accepting `shop_candidates` | A planted or misread candidate (hobby site, portfolio, competitor game) would get a public scored page | Candidates stay `new`; nothing is crawled | 100 accepted candidates with zero rejections after publication |

Definitions live in `DECISIONS.md` and a nightly code job updates the counters in `agent_settings.gates`; the digest prints them. Incident: a Vercel rollback, a `pipeline.yml` failure caused by merged code, or a dispute whose `resolved_note` cites a code bug. Complaint: a Resend `email.complained` webhook or a reply containing an opt-out.

One-time human setup, listed once: KvK registration, signing the LIA (agent drafts it), Daisycon application, Stripe account, Payment Links (created once by Stefan) and webhook secret, Vercel Pro, Supabase EU, Resend, PostHog, Anthropic Console workspace with a hard monthly spend limit and `ANTHROPIC_API_KEY`, GitHub repo with branch protection, CODEOWNERS, GitHub Environments for secrets bound to `main`, the repository setting "Allow GitHub Actions to create and approve pull requests" ([GitHub changelog](https://github.blog/changelog/2022-05-03-github-actions-prevent-github-actions-from-creating-and-approving-pull-requests/)), a second GitHub App for the Reviewer, Search Console API service account and Bing verification, Pinterest developer app, Meta and Google Ads accounts, DNS, bank details for Daisycon payout. Runbook: the second hard stop is pausing each routine in the Claude Code routines UI; the repo cannot do that.

## 5. Phases and exit criteria

Weeks from start. Each phase names what the agents do; founder work is limited to setup and gates.

**Phase 0: Setup (weeks 1-2).** KvK registration (art. 3:15d BW identity and the Daisycon application). Private repo, Vercel Pro ($20; affiliate purpose makes Hobby non-compliant per the [fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)), Supabase EU, migration 0001, CLAUDE.md, CODEOWNERS, `agents/` scaffold, `claude-code-action` workflows with Developer and Reviewer (Reviewer under its own GitHub App), `/go/`, public `/over` with footer identity, LIA, apply to Daisycon. Daisycon may ask for a live site; `/over`, `/privacy`, `/informatie-voor-webshops` and `/go/` are exempt from Basic Auth. If rejected, re-apply in week 9.
Human\: KvK, LIA signature, Daisycon form, accounts and secrets.
Exit: a test click lands in `clicks`; the Developer agent has opened one PR from a human-labelled issue, the Reviewer has approved it and the approval counts toward the required review; LIA signed.

**Phase 1: Private MVP (weeks 3-8).** Private via Next.js middleware Basic Auth from an env variable (Vercel Password Protection costs $20 per project on Pro, [pricing](https://vercel.com/docs/deployment-protection/usage-and-pricing)), with the public exemptions above. Shop Scout runs from week 3 with a 60-candidate target from imported source lists; Stefan accepts them in G6 batches; the seed import reads accepted candidates. Pipeline steps 1-7 on 60 shops, scoring, home, category and shop pages, `/admin`, nightly cron (`pipeline.yml` lands right after the scoring step). Score Auditor replaces founder hand-checks: it scores all 60 shops independently with a stronger model, reads the full crawl text, and uses its own rubric prompt. Tuning is owned by the Score Auditor: after each run it files one `agent-proposed` escalation with MAE per sub-score, the 10 largest deltas and a proposed weight or prompt change on the 45 tuning shops; Stefan relabels, the Developer makes the PR, `lib/scoring/` stays a G1 merge; 15 shops are held out. Ops Watchdog, `health_checks`, `agent_schedule` gap check and `agent_runs` live from week 5.
Human\: G1 merges and relabels, G6 taps.
Exit: MAE under 12 between pipeline and auditor on the held-out 15; every published quote verified; Lighthouse mobile 90+ via Protection Bypass for Automation; 14 days of green `agent_runs` with zero schedule gaps.

**Phase 2: Public launch (weeks 9-12).** Remove Basic Auth. 150 shops, 5 sub-categories chosen by product query volume, at least 40% affiliate coverage each. Pre-notice email to every shop 7 days before its page goes live (code, to `shops.contact_email`). Dispute Handler live before the first pre-notice goes out. Sitemap, JSON-LD, ranking disclosure, PostHog, Search Console API import job, SEO/Growth Analyst, newsletter double opt-in with the "Vanaf [maand]" copy and welcome email, dispute form at `/herbeoordeling`, `/hoe-wij-beoordelen`, `/informatie-voor-webshops`. Code runs Playwright screenshots of 5 random pages at 390 px each week and attaches them to the digest; the weekly phone check is gone.
Human\: G1, G4, G6.
Exit: sitemap accepted and 50% indexed within 30 days (Analyst reads `search_console_daily`); CTR measured on 500+ organic shop-page sessions, split by source; impressions tracked for 20 queries; every dispute answered within 7 days by the agent.
Pivot gate: after 2,000 organic shop-page sessions, if CTR under 8% and sign-up under 1%, the Analyst files an escalation proposing the "keurmerk en feiten vergelijken" headline for 4 weeks; Stefan picks in one tap.

**Phase 3: Automate and test (weeks 13-20).** Pipeline unattended, 400 shops, lead magnet, `guide_issues`, Guide Editor and Fact Checker with the redraft loop, first weekly guide in week 13, Outreach agent for badge sales from week 14, "Geverifieerd" badge via Stripe Payment Link with `/api/stripe/webhook` fulfilment, `tsvector` search, `/keurmerk/[slug]`, ad tests one at a time with Analyst readouts, Pinterest pins via G3.
Human\: G2 taps (8 weeks), G3 taps, G5 decisions.
Exit: 3 pending transactions; 300 confirmed subscribers; 8 weekly guides published on time; one channel under EUR 3 per subscriber; 14 green nightly runs; G2 removed.

**Phase 4: Scale (weeks 21-52).** First approved commission by week 22 (advertisers have 60 days, [Daisycon FAQ](https://faq-publisher.daisycon.com/hc/nl/articles/360002672318-Hoe-werkt-de-transactiekeuring); payout needs EUR 25 and advertiser payment, [FAQ](https://faq-publisher.daisycon.com/hc/nl/articles/205960941)). 1,500 shops, second category, "Uitgelicht", claiming moderated by the Dispute Handler, TradeTracker and Awin, filters. G1 relaxed to auto-merge for small app PRs once its criterion is met; G3 and G6 removed when met. If routine limits bite, move scheduled agents to `claude-code-action` cron, then Managed Agents.
Exit: north-star reached; 4 weeks with zero founder actions besides gates.

## 6. Feature scope per phase

**MVP IN (phases 0-2):** home; category and sub-category lists sorted by score with a "Hoe is deze volgorde bepaald?" link directly above each list (art. 6:193e lid 2 BW, [VBK analysis](https://vbk.nl/sites/default/files/documents/Marketing/Publicaties/Anouk%20Lankhaar_Bb%202022%2077%20_Transparantie%20vereist%20welke%20parameters%20bepalen%20de%20rangschikking%20van%20online%20zoekresultaten(1670076.1).pdf)); shop page with score, earned sub-scores and quotes, facts, keurmerk status, disclosure, "Naar de webshop" via `/go/`; `/go/[slug]` logging; newsletter double opt-in and welcome email; dispute and objection form at `/herbeoordeling` with signed confirmation link; pre-notice email job; `email_queue`; `/admin` (gate taps G1 to G6, kill switch, agent run log and schedule gaps, dispute queue, keurmerk review queue (Score Auditor writes, human reads), candidate queue, unpause); legal pages; sitemap, robots, JSON-LD; `/api/revalidate`; `/api/health`; nightly pipeline; `health_checks`, `agent_schedule`, `agent_escalations` and the issue-filing job; Search Console import; `agents/` with Developer, Reviewer, Score Auditor, Shop Scout, Dispute Handler, Ops Watchdog, SEO/Growth Analyst.

**MVP OUT:** search; accounts, claiming, reviews, favourites; filter UI; comparison pages, blog, gids; CMS; dark mode, i18n, other categories; paid placement; app; any published negative inference (`marketplace_pattern`, `dropship_indicators` stay internal); Vercel eve.

**Phase 3 adds:** lead magnet, `/badge/[slug]`, `/beste/webshops-[product-intent]` pages with 300+ words and unique data blocks, "Geverifieerd" badge via Stripe Payment Link and `/api/stripe/webhook`, weekly gids (`/gids`, `/gids/[yyyy]-week-[ww]`) with fallback page, Guide Editor, Fact Checker, Outreach, `/keurmerk/[slug]`, `tsvector` search, `pin_drafts` and the Pinterest post job.

**Phase 4 adds:** "Uitgelicht" block, claim flow, second category, TradeTracker and Awin, filters, auto-merge widening.

## 7. Data model and scoring

Supabase Postgres EU. RLS on every table. `shops_public` view created `with (security_invoker = true)` plus an anon `select` policy on `shops` limited to `status = 'published'`; anon select revoked on all other tables ([Supabase RLS guide](https://supabase.com/docs/guides/auth/row-level-security)). SQL test: anon query of `shops_public` returns zero draft rows.

Per-agent Postgres **login roles** (`create role ... with login password`), each connecting through the Supavisor pooler connection string (routine VMs are IPv4 only), with the password stored only in that agent's routine or workflow. The Supabase REST API maps only the anon and service keys to roles, so custom roles need a direct connection ([Supabase roles](https://supabase.com/docs/guides/database/postgres/roles.md), [custom claims](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)). Roles: `agent_scout`, `agent_auditor`, `agent_dispute`, `agent_guide`, `agent_factcheck`, `agent_outreach`, `agent_analyst` (read-only plus `agent_escalations` and `pin_drafts`), `agent_ops`, `pipeline`. Grants are table-level and column-level as listed in section 3. Value rules are enforced by RLS `WITH CHECK` policies per role (for example `status in ('draft','hidden')` for `agent_auditor`; `status in ('fact_checked','rejected')` for `agent_factcheck`) and a `BEFORE UPDATE` trigger on `shops` that rejects `published` unless `current_user = 'pipeline'`. Only `pipeline` may write `scores`. SQL tests per role: `agent_auditor` cannot set `published`; `agent_guide` cannot set `status = 'fact_checked'`; `agent_factcheck` cannot update `body_md`; no agent role can update `shops.score`.

Hard kill switch: a plain Actions job (`kill-switch.yml`, on `workflow_dispatch` and when `agent_settings.agents_enabled` turns false) runs `ALTER ROLE agent_x NOLOGIN` and `SELECT pg_terminate_backend(...)` for every agent role and rotates their passwords. The soft guard `checkKillSwitch()` stays in every job but is advisory only. The second hard stop is a runbook step: pause each routine in the routines UI.

- `shops`: id, slug, name, domain (unique), category_id, platform, product_count_est, product_count_method, domain_first_seen, domain_age_sources (jsonb), keurmerk (enum[]), keurmerk_status, keurmerk_verified_method, affiliate_available, price_level, has_physical_store, store_city, ships_from_country, contact_email, contact_email_source (contact_page, prenotice_reply, manual), score, score_version, score_label, status (draft, prenotified, published, hidden, disputed, removed), description_nl, affiliate_network, affiliate_url, verified_badge_until, created_at, updated_at. `contact_email` holds role addresses only (`info@`, `contact@`, `klantenservice@`, or the generic address on the shop's contact page) on the shop's own domain; anything that looks like `firstname@` or `firstname.lastname@` is dropped. Documented in the LIA and `/informatie-voor-webshops`.
- `categories`: id, slug, name_nl, parent_id, intro_nl, seo_title, sort_order.
- `crawl_pages`: id, shop_id, url, page_type, fetched_at, status_code, robots_allowed, content_hash, text_excerpt (20,000 chars, deleted after 90 days).
- `shop_signals`: append only; id, shop_id, run_id, signal_key, value_numeric, value_bool, evidence_quote, evidence_url, quote_verified, match_ratio, source (rule, llm, registry, auditor, human).
- `scores`: id, shop_id, run_id, score_version, total, sub_scores jsonb, caps_applied, model, prompt_version, override_id.
- `score_runs`: id, started_at, finished_at, batch_id, batch_status, shops_submitted, shops_scored, parse_failures, quote_match_rate, cost_usd, status.
- `score_checks`: id, shop_id, checker (auditor, human), checker_model, checker_prompt_version, check_total, sub_scores jsonb, delta, holdout (bool), verdict (agree, review, escalate), note, checked_at.
- `score_overrides`: id, shop_id, proposed_by (agent, human), old_total, new_total, reason, status (draft, approved, rejected, applied, applied_by_default), approved_by, created_at. Applied only by the publish code path.
- `shop_candidates`: id, domain (unique), name, source, reason, suggested_category_id, status (new, accepted, rejected, duplicate), decided_by, agent_run_id, created_at.
- `source_lists`: id, source (thuiswinkel, daisycon, directory), domain, name, raw jsonb, imported_at. Filled weekly by code from allowlisted sources.
- `clicks`: id, shop_id, occurred_at, referer_path, source, device, country. No IP, no ua_hash.
- `disputes`: id, shop_id, email, confirm_token_hash, confirmed_at, message, type (prenotice, correction, removal, objection, claim), status (open, awaiting_confirmation, agent_replied, awaiting_human, resolved), reply_template_id, reply_slots jsonb, resolved_note, agent_run_id, deadline_at, created_at, resolved_at.
- `subscribers`: id, token_hash, confirmed_at, resend_contact_id, source_path, created_at.
- `email_queue`: id, to, shop_id, template, slots jsonb, priority, send_after, sent_at. Recipient for shop emails is resolved from `shops.contact_email` at send time.
- `outreach_drafts`: id, shop_id, kind (badge_offer, uitgelicht_offer, follow_up), subject, body_md, status (draft, approved, queued, sent, expired), agent_run_id, approved_by, created_at.
- `guide_issues`: id, iso_year, iso_week, slug (`2026-week-44`), title_nl, intro_nl, body_md, shop_ids (uuid[]), inputs_snapshot jsonb, status (draft, fact_checked, rejected, approved, published, sent, fallback), redraft_count, fact_check_report jsonb, resend_broadcast_id, published_at, sent_at. Unique on (iso_year, iso_week).
- `pin_drafts`: id, shop_id, title, description, image_url (own domain only), status (draft, approved, posted, expired), agent_run_id, approved_by, posted_at.
- `search_console_daily`: date, page, query, clicks, impressions, ctr, position; filled daily by code via the Search Console API service account.
- `health_checks`: id, check (health_endpoint, vercel_status, supabase_status, failed_runs, token_spend, screenshots, schedule_gap), status, detail jsonb, checked_at. Written by code.
- `agent_schedule`: agent, cron, timezone, max_gap_minutes. A code job every 6 hours compares the last `agent_runs` row per agent to `max_gap_minutes` and emails Stefan on a miss.
- `agent_escalations`: id, agent, kind, title, body_md, label (`agent-proposed`, `needs-human`), github_issue_url, status (new, filed, closed), agent_run_id, created_at. A code job files the GitHub issue.
- `agent_runs`: id, agent, runs_on (routine, action, code), trigger, started_at, finished_at, status (ok, failed, paused, over_budget), input_ref, output_refs jsonb, tokens_in, tokens_out, cost_usd_est, summary, error.
- `agent_settings`: key, value jsonb, updated_by, updated_at. Keys: `agents_enabled` (soft switch, also triggers the hard kill job), `enabled.<agent>`, `paused_until.<agent>`, `max_tokens_per_run.<agent>`, `monthly_budget_usd`, `month_spend_usd`, `gates` (G1 to G6 on/off with criterion counters).
- `commissions`: id, shop_id, network, amount_eur, status, reported_at.

**Scoring approach.**
1. Rules write deterministic signals: product count, platform, KvK (8 digits with "KvK" or "Kamer van Koophandel" within 30 characters; stored as boolean), keurmerk, domain age, `contact_email` (role addresses only).
2. Haiku Batch API with structured outputs gets home, "over ons" and three product pages plus rule facts. Returns `own_production`, `brand_owner`, `focus`, `has_named_owner`, `has_address`, `origin_claims`, `marketplace_pattern`, `dropship_indicators`, `price_level`, `has_physical_store`, `store_city`, `ships_from_country`, `description_nl`, and evidence quotes. No field for a person's name or address text. The model never outputs the final score.
3. Two-step batch handling: night N submits and stores `batch_id` (batches can take up to 24 hours, [Batch docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing); Actions jobs cap at 6 hours, [GitHub limits](https://docs.github.com/en/actions/reference/usage-limits-billing-and-administration)). Every run first collects ended batches, verifies quotes, writes scores.
4. Quote verification: NFKC normalise, collapse whitespace, map quote variants, strip soft hyphens, Levenshtein ratio above 0.95. Quotes containing a detected personal name are dropped. Run fails under 80% match rate. Fewer than 4 valid signals keeps the shop draft.
5. Score in `lib/scoring/weights.ts`; rescoring needs no LLM run.
6. Publication: total under 30 or `marketplace_pattern`: facts plus neutral label "Grote winkel / marktplaats", no number. 30-40: hidden until the Score Auditor agrees within 10 points; otherwise stays hidden and escalates.
7. Score Auditor: all shops in phase 1; afterwards every new shop plus 10 random published shops per week as rolling holdout, with a stronger model, a separate rubric prompt and full crawl text. It writes `score_checks`. Delta over 20 points, or any disagreement on `marketplace_pattern`, writes an `agent_escalations` row with both rationales. Weekly it compares the score distribution with the previous 4 weeks and flags drift over 5 points in the mean. It never edits `scores`.
8. Pre-notice: 7 days before publication, code sends an email to `shops.contact_email` with score, facts and a "klopt niet" link that opens the `/herbeoordeling` form; logged in `disputes` as `prenotice`. Serves as GDPR notice and first outreach.
9. Dispute and objection, code first: the server action sets `disputed` instantly and the score reads "In beoordeling" (safe direction, no proof needed). For `removal` or `objection` (art. 21) the code then emails a signed confirmation link to an address on the shop's own domain (`contact_email`, or `info@`/`contact@` found on the site). `removed` is applied the moment the link is clicked: the page revalidates and a confirmation email goes out, well inside the 48-hour duty; `deadline_at` and an hourly code check guarantee it even if the action failed. Dispute submissions are rate-limited per shop and per IP at the edge. The Dispute Handler then verifies the claim against stored evidence, picks a reply template and fills typed slots (shop name, dispute type, deadline date, list of corrected facts from `score_overrides`); the queue tool rejects any slot containing internal signal names, other shop ids, or URLs off the site's domain. Free text goes only to `resolved_note`. Answer within 7 days, measured by code. G4 default after 7 days as in section 4.

## 8. Data pipeline build order

1. Source list import (code, weekly): Thuiswinkel member list and, after approval, the Daisycon programme list into `source_lists`. Shop Scout picks candidates from `source_lists` only; Stefan accepts them in G6 batches; a code step checks domain, category and duplicates and the pipeline crawls accepted candidates. The 60 seed shops come from this path in weeks 3-4.
2. `fetchPolite()`: robots.txt, 1 request per 3 s per domain, 10 s timeout, named User-Agent with contact email. Separate Wayback limiter: 1 request per 10 s, 20 s timeout, backoff, 429 means "retry next night" ([observed limits](https://cirosantilli.com/wayback-machine-rate-limit)).
3. Sitemap product count, fallback to collection pages.
4. Platform fingerprints (one PR each): Shopify, WooCommerce, Lightspeed, Magento, Shopware, CCV Shop.
5. Keurmerk: badge link must resolve; Thuiswinkel via `thuiswinkel.org/leden/*/certificaat` containing the domain ([Thuiswinkel](https://www.thuiswinkel.org/en/safe-online-shopping/checking-trustmarks/)); Trusted Shops via certificate URL; WebwinkelKeur via member ID. Otherwise `unverified`, shown as "keurmerk gevonden, nog niet geverifieerd"; code fetches the certificate page text into `crawl_pages`, the Score Auditor reviews the queue from that text and marks what it can verify, the rest stays `unverified`.
6. Domain age: SIDN WHOIS once per domain, max 1 per 10 s, stop at 5 remaining requests ([WhoAPI](https://whoapi.com/blog/exploring-nl-whois-the-digital-gateway-to-the-netherlands/)); Wayback first capture. Show "online sinds ongeveer" only when both agree within 2 years.
7. `scoreBatch()` submit; `collectBatches()` collect.
8. Score computation, caps, labels.
9. Pre-notice job, then publish job: POST changed paths to `app/api/revalidate/route.ts` with `REVALIDATE_SECRET`. The publish job is the only writer of `published` and the only applier of approved `score_overrides`.
10. Nightly GitHub Actions at 01:00 Europe/Amsterdam (two UTC crons, 23:00 and 00:00, the job exits unless local time is 01:00), idempotent, recrawl 1/30 of shops plus changed or 90-day-old pages, fail over 10% errors. Repo private so schedules are not auto-disabled ([GitHub docs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)). Downstream jobs chain by state, not clock: the Score Auditor and the `guide_inputs` refresh first check that today's `score_runs` row is `ok`, otherwise retry in 1 hour, max 3. `/api/health` reads the newest `score_runs`, `agent_runs` and `health_checks` rows; a free uptime monitor alerts when they are older than 48 hours, and the schedule gap job alerts per agent on its own `max_gap_minutes`.
11. `email_queue` sender: max 90 per day on Resend free (100 transactional per day, 3,000 per month, [Resend pricing](https://www.resend.com/pricing.md)), opt-in confirmations and dispute confirmation links first, then template dispute replies, then approved outreach. Resend Pro (USD 20 per month, no daily limit) during ad weeks if the queue exceeds one day (G5).
12. Weekly guide job (code): Monday 06:00 refreshes the `guide_inputs` view after the nightly run is `ok`; Guide Editor 06:30; Fact Checker 08:00. If `rejected`, the Editor redrafts Tuesday 03:00 and Wednesday 03:00 with `fact_check_report` as input (max 2 redrafts), then the Fact Checker runs again. If still rejected at Wednesday 10:00, the Publisher publishes a code-generated fallback page (top 5 shops by clicks, numbers only, status `fallback`) and skips the email; the miss is logged in `agent_runs` and the digest. Thursday 10:00 local the Publisher publishes the page, creates the Broadcast from `body_md` and sends it. Broadcasts count contacts, not emails: free up to 1,000 contacts, then USD 40 per month for 5,000 ([Resend pricing](https://www.resend.com/pricing.md)). The upgrade is pre-approved under G5 at 950 subscribers so the send never stops.
13. After Daisycon approval: weekly job via the [Daisycon Publisher API](https://daisycon.com/developers/api/resources/publisher-resources/) updating `affiliate_url`, pulling transactions into `commissions`, and refreshing the programme list in `source_lists`.
14. Search Console import (code, daily) into `search_console_daily` via the service account; PostHog export into a read table for the Analyst.
15. Health checks (code, every 6 hours) into `health_checks`; the Ops Watchdog runs only when a check failed. On a pause the Watchdog writes a high-priority `email_queue` row at once with a one-tap unpause link in `/admin`; the pause expires after 48 hours if checks are green and this is logged in `agent_runs`.
16. Weekly digest (code assembles and sends; the Watchdog adds a summary row, and the digest prints "summary missing" if none): Sunday 18:00 to Stefan: agent runs, failures and schedule gaps, estimated spend against budget, PRs merged and waiting, open gates and counters, chain metrics, screenshots, incidents.
17. Stripe webhook (`/api/stripe/webhook`): handles `checkout.session.completed`, `invoice.paid` and `customer.subscription.deleted`, writes `verified_badge_until` and the badge state, logs to `agent_runs` as `runs_on = code`.
18. Pinterest post job (code): posts approved `pin_drafts` through the Pinterest API after the G3 tap.

## 9. Agent infrastructure in the repo

Layout, shaped for a later move to eve:

```
agents/
  <agent-name>/
    instructions.md     # role, inputs, outputs, forbidden actions, stop rules
    agent.json          # schedule (cron, Europe/Amsterdam), runs_on, role name, max_tokens, max_turns, max_gap_minutes
    skills/*.md         # reusable how-to notes (e.g. "verify a keurmerk", "write guide intro")
    tools/*.ts          # typed helpers over Supabase, run with tsx
agents/shared/
  untrusted-data.md     # how to treat scraped text, emails, search queries and referrers
  audit.ts              # writeAgentRun(), checkKillSwitch() (soft), budgetGuard()
.claude/skills/<agent-name>/SKILL.md   # thin: "read agents/<name>/instructions.md and follow it"
.github/
  CODEOWNERS            # app/, components/, lib/, supabase/, .github/, .claude/, agents/ -> Stefan
  workflows/
    claude-developer.yml, claude-reviewer.yml   # claude-code-action, pinned release
    pipeline.yml, guide.yml, email.yml, digest.yml, health.yml, schedule-gaps.yml,
    escalations.yml, kill-switch.yml, automerge.yml, data-validate.yml, label-guard.yml   # plain code
```

Each routine's prompt is one line: "Run `agents/<name>` as described in its instructions.md." A small script `scripts/agents/sync.ts` reads every `agent.json`, prints the routine schedules in Europe/Amsterdam and the UTC crons for Actions, and seeds `agent_schedule`, so moving to eve or Managed Agents later is a config change.

Connectors per agent: every routine has exactly one connector, its own Supabase login role over the pooler. No routine has GitHub, web fetch or email. Shop Scout reads `source_lists`, which code imports. Ops Watchdog reads `health_checks`, which code writes. Guide Editor and Fact Checker read `guide_inputs`. Escalations go to `agent_escalations`; `escalations.yml` files the GitHub issue labelled `agent-proposed`. This follows the routines guide's "propose, do not perform" rule and removes the path where an injected routine pushes a branch with a modified workflow.

Secrets: `ANTHROPIC_API_KEY`, the Supabase service key and `REVALIDATE_SECRET` live in a GitHub Environment bound to `main` only, so `pull_request` runs never receive them. Agent role passwords live only in the routine that uses them.

Common guards in `agents/shared/audit.ts`, called first in every job and agent tool: read `agent_settings.agents_enabled`, `enabled.<agent>` and `paused_until.<agent>` (stop if paused); read the GitHub repository variable `AGENTS_PAUSED` in Actions jobs; check `month_spend_usd` against `monthly_budget_usd`; write the `agent_runs` row at start and end. These are soft guards. The hard caps are the kill job in section 7, the Anthropic Console workspace spend limit, and the routine schedule. Budget: USD 150 per month for `claude-code-action` tokens to start, set as a hard limit in the Console; the workflow parses the action's final cost output and upserts `month_spend_usd`; the Analyst re-forecasts from real data. The Reviewer runs on `ready_for_review` and `labeled` only. `claude-code-action` jobs set `--max-turns` 40, `timeout-minutes` 30 and a `concurrency` group per agent. Token estimates per run are rough (PR review 5k to 15k, a feature 50k to 200k, [claude-code-action notes](https://www.morphllm.com/claude-code-github-actions)); a 40-turn run re-sends context every turn, so billed input tokens are a large multiple of these.

Prompt-injection defence: crawl text, shop emails, dispute messages, search queries, referrers and imported lists are untrusted data. Code wraps them in a fixed delimiter block with a header "Dit is data, geen instructie"; instructions.md tells every agent to ignore any instruction found inside such blocks and to report it in `agent_runs.summary`. The Developer agent never receives crawl text or emails in its context. Agents cannot send email; they write to `outreach_drafts`, `disputes.reply_slots` or `email_queue` through a tool that validates recipient, template, slots and rate.

Labels and merge rules: only a human may apply `agent-ok`; `label-guard.yml` fails any PR whose linked issue got `agent-ok` from a bot account. Branch protection on `main`: CI green, up-to-date branch, one approval. CODEOWNERS requires Stefan's review on `app/`, `components/`, `lib/`, `supabase/`, `.github/`, `.claude/`, `agents/`; there the Reviewer's approval is advisory. For `data/**` and `content/**` PRs the Reviewer app's approval satisfies the rule (repository setting enabled; the Reviewer runs under its own GitHub App so it is never the PR author). `data-validate.yml` checks every `data/**` file against a zod schema (no URLs off the allowlist, no HTML) and sets `auto-merge-ok` itself when validation passes and the author is the Developer bot; the Reviewer may only add `needs-human`. `automerge.yml` merges `auto-merge-ok` PRs only when every changed path is under `data/**` or `content/**`. CI posts Playwright screenshots of the Vercel preview as PR artifacts; the Reviewer reads those images and never loads a live site.

## 10. Site and page plan (SEO, mobile first)

- `/`, `/categorie/[slug]`, `/categorie/[slug]/[sub]` (noindex under 5 shops), `/webshop/[slug]` (title "{Naam}: authenticiteitsscore, keurmerk en feiten"), `/beste/webshops-[product-intent]` (15+ shops, 300+ words, methodology block, newsletter form), `/keurmerk/[slug]` (phase 3; noindex until 30+ shops and 300 words), `/go/[slug]` (302, noindex), `/badge/[slug]`, `/gids` and `/gids/[yyyy]-week-[ww]`, `/over`, `/hoe-wij-beoordelen`, `/informatie-voor-webshops`, `/privacy`, `/herbeoordeling` (dispute and objection form).
- Unique data on every page. Google's 2026 enforcement of the scaled content abuse policy hit programmatic pages without unique value; pages must carry data not available elsewhere ([programmatic SEO 2026](https://alexcloudstar.com/blog/programmatic-seo-2026-indie-hackers/)). Every shop, category, `/beste/` and guide page therefore shows at least three first-party data points: verified score and sub-scores, verified keurmerk status, click-based "meest bezocht deze maand", and score changes over time. No AI filler paragraphs; guide text is tied to that week's data and checked by the Fact Checker. The SEO/Growth Analyst watches indexation in `search_console_daily` and files an escalation when a template's indexed share drops 20% in 30 days.
- Every ranked list has "Hoe is deze volgorde bepaald?" directly above it, naming the six signals, weights, caps and "Betaling heeft geen invloed op de volgorde". "Uitgelicht" renders as a separate block labelled "Advertentie".
- Footer on every page: name, address, KvK, BTW, email ([art. 3:15d BW](https://wetboekplus.nl/burgerlijk-wetboek-boek-3-artikel-15d-dienst-informatiemaatschappij/)).
- Static generation with ISR 86,400 s plus on-demand revalidation. Server components; client JS only for the newsletter form. Single column, 44 px targets, score and button above the fold.
- Schema.org: `ItemList`, `Organization`, `BreadcrumbList`, `WebSite`. No `AggregateRating` or `Review`. Sitemap from `app/sitemap.ts`, published shops and published guides only. robots blocks `/go/`, `/admin/`, `/api/`, `/herbeoordeling`.

## 11. Growth plan and the EUR 1000

No ads before phase 3. Free first: Search Console and Bing, pre-notice emails to every shop (code), badge emails (Outreach agent), Pinterest board (Analyst writes 10 `pin_drafts` per week, G3 batch tap, code posts them through the Pinterest API).

Paid clicks earn roughly EUR 0.05 to 0.30 each (assumption). One test at a time; EUR 350 unallocated until test 1 has finished. The Analyst agent writes the test plan and the readout as escalations; G5 decides spend.

1. Meta, NL, 35-60, interieur and wonen, lead magnet "De 25 meest authentieke woonwebshops van Nederland" behind double opt-in. Decision at EUR 150 spent or 100 sign-ups. Kill line EUR 5 per confirmed subscriber, success line EUR 3 ([benchmark](https://www.superads.ai/facebook-ads-costs/cost-per-lead/e-commerce/netherlands)). Budget EUR 250.
2. Pinterest promoted pins, same rules, EUR 200.
3. Google Search, generic product-intent keywords, landing on `/beste/` pages with first-party content (Daisycon requires keyword-marketing approval per campaign, art. 2.12; Google rejects bridge pages, [policy](https://support.google.com/adspolicy/answer/16427718)). EUR 200.
4. Winner retest, EUR 350.

Quality metric: share of new subscribers who click a shop within 14 days. Newsletter form after the score: "Elke week 5 unieke woonwinkels in je inbox" from week 13 ("Vanaf [maand]: ..." before that), no mobile pop-ups. Weekly guide metrics: open rate, click rate to `/webshop/` pages, unsubscribe rate under 0.5% per send, on-time rate.

## 12. Monetization rollout

**Weeks 2-12, affiliate setup; live from approval.** Daisycon application with public `/over` and KvK data (exempt from Basic Auth). If Daisycon rejects a private site, re-apply in week 9 at public launch. `/go/` uses `affiliate_url` when present. `rel="sponsored nofollow"` and the disclosure "Wij ontvangen mogelijk een vergoeding als je via onze links koopt. Dit beïnvloedt de score of volgorde niet." Sub-categories go live only at 40% coverage.

**Week 14+, "Geverifieerd" badge.** EUR 19 per month for shops scoring 70+ with clicks and no affiliate programme: verified status, badge embed, monthly click report (code). Stripe Payment Link created once by Stefan; the Outreach agent only inserts the fixed link; `/api/stripe/webhook` sets and clears `verified_badge_until`. G3 approves batches until removed. Never changes score or order.

**Week 22+, "Uitgelicht".** EUR 49 per month, max two per sub-category, labelled "Advertentie", 70+ only. Fixed Payment Link; Outreach agent drafts under the same rules.

**Week 30+, claiming.** Supabase Auth magic link, verification by email on the shop domain, editable description and photos; edits land as drafts that the Dispute Handler moderates against the no-personal-data and no-review rules. TradeTracker and Awin added in phase 4.

## 13. Vibecoding workflow

**Repo.** Private GitHub repo from the [Next.js and Supabase starter](https://vercel.com/templates/next.js/supabase). pnpm, Tailwind, shadcn/ui, vitest, Playwright, Supabase CLI, `scripts/pipeline/*` via `tsx`, `agents/*`, the workflows in section 9, CODEOWNERS, branch protection, Vercel preview per PR, `DECISIONS.md` (gate definitions, incident and complaint definitions).

**CLAUDE.md outline.**
1. Product in five lines; "uniek en betrouwbaar"; Dutch "je"; never "onbetrouwbaar" or "review".
2. Stack, folder map, commands; server components by default.
3. Data: no browser writes; RLS everywhere with `WITH CHECK` per role; `security_invoker` views; per-agent login roles; `supabase migration new` only; regenerate types after migrations.
4. Scoring: model never sets the score; every published signal has a verified quote; evidence only for points earned; negative inferences internal; weights only in `lib/scoring/weights.ts`; prompt versioned; auditor never edits `scores`.
5. Pipeline: all HTTP via `fetchPolite()`, all LLM via `scoreBatch()` and `collectBatches()`; tests use fixtures, never the internet.
6. Agents: every job calls `checkKillSwitch()` and `writeAgentRun()`; agents write drafts, queues, escalation rows and PRs only; no routine has GitHub or web access; publication only through the publish job; untrusted-data rule; no email sending from agents; dispute replies are templates with typed slots; one issue is one PR under 400 lines; `agent-proposed` is for agents, `agent-ok` is human-only and means the Developer may start; `needs-human` means stop and summarise.
7. Legal: ranking disclosure above every list; "Advertentie" never inside the ranked list; footer identity; `rel="sponsored nofollow"`; no IP or ua_hash; no personal names or addresses stored; `contact_email` is a role address only; no `AggregateRating`; pre-notice before publication; removal and objection handled by code within 48 hours after confirmation.
8. Definition of done: typecheck, vitest, Playwright at 390 px and Lighthouse mobile 90+ on PRs touching `app/` or `components/`, against local `next start` with `supabase start` and 5 fixture shops; preview checks use Protection Bypass for Automation; role tests for every new table and policy.
9. Slicing: one migration PR per feature group, under 400 lines, migration first in its own PR; one PR is one pipeline step, page, component or agent.
10. Supabase agent skills and `supabase gen types`.

`.claude/skills/` holds one SKILL.md per agent (developer, reviewer, shop-scout, score-auditor, dispute-handler, guide-editor, fact-checker, outreach, seo-growth-analyst, ops-watchdog) plus `migration`, `pipeline-step`, `ui-page`. Each agent SKILL.md is a pointer to `agents/<name>/instructions.md` so the content has one home.

**QA gates.** Typecheck and vitest on every PR; Playwright screenshots and Lighthouse on UI PRs, posted as artifacts; zod validation on `data/**`; pipeline dry run on 5 fixtures when `scripts/` or `agents/*/tools` change; role tests when `supabase/` changes; Reviewer agent on every ready PR; weekly screenshots in the digest.

## 14. Top risks and mitigations

1. **Defamation.** Positive-only evidence, neutral label under 30, 30-40 hidden until the auditor agrees, pre-notice 7 days before publication, instant "In beoordeling", template replies that cannot carry internal signals, 7-day answer by the Dispute Handler, G4 with a safe-direction default, logged overrides.
2. **GDPR on shop-owner data.** The Dutch AP treats scraping personal data as almost always unlawful ([IAPP](https://iapp.org/news/a/netherlands-dpa-issues-guidance-against-web-scraping)); the CJEU allows commercial legitimate interest with documented necessity and balancing ([HLC on C-621/22](https://www.hlc.com/en/publications/cjeu-clears-the-air-dutch-dpas-interpretation-of-legitimate-interests-is-too-strict)). Booleans only, role addresses only for `contact_email`, LIA before the first crawl, `/informatie-voor-webshops`, pre-notice, removal by code within 48 hours.
3. **Agent does the wrong thing.** Least-privilege login roles with `WITH CHECK` policies and triggers, drafts not publishes, no GitHub or web in routines, human-only `agent-ok`, CODEOWNERS, Reviewer plus CI plus screenshot artifacts, auto-merge only for validated data and content paths, hard kill job plus soft guards, `agent_runs` audit, schedule gap alerts, Ops Watchdog can pause. Recovery: every published row has a prior `scores` row and every page a prior deploy; rollback is one Vercel action and one SQL update.
4. **Prompt injection from shops and from analytics data.** Untrusted-data wrapping, no email sending by agents, template replies, Developer never sees scraped text, signed confirmation links instead of self-declared sender domains, routines without GitHub or web, secrets in a `main`-bound Environment, action pinned above the known CVE.
5. **Agent platform risk.** Routines are a research preview with no memory between runs, a 100 runs per hour cap, and rejected runs when the subscription window is empty; schedules are 6-hourly or slower and runs skip when there is no work. State lives in the database, not in the agent. Code detects missed runs. Fallback path: `claude-code-action` cron, then Managed Agents. Eve stays an option because instructions and skills are plain files.
6. **Cost creep.** Hard spend limit in the Anthropic Console, monthly budget in `agent_settings` with parsed real costs, per-run token and turn caps, Reviewer on ready PRs only, Ops Watchdog pauses at 100% of budget and warns at 70%, digest shows spend.
7. **Ranking transparency law.** Disclosure link above every list; paid blocks outside the ranking; undisclosed paid ranking is per se unfair ([Lexgo](https://www.lexgo.be/en/news-and-articles/11892-the-omnibus-act-more-transparency-for-consumers)).
8. **Scraping.** Public pages, robots.txt, low rates, excerpts only, 90-day retention.
9. **Visitor GDPR and Telecommunicatiewet.** PostHog `cookieless_mode: 'always'`, `person_profiles: 'never'`, autocapture and recording off ([PostHog docs](https://posthog.com/docs/privacy/cookieless-tracking)). A banner before any persistent ID. Outreach email is B2B, one per shop per 90 days, with opt-out, and gated until trusted.
10. **Affiliate rules.** ACM disclosure; Daisycon media registration for the website only; the weekly email links to own pages only.
11. **Economics.** Chain metrics from week 9; 40% affiliate coverage rule; direct badge fee for makers; EPC target EUR 0.13 per commission-capable click checked monthly.
12. **Platform traps.** Vercel Pro from week 2; private repo; health monitor; Supabase pause guarded by nightly runs; Resend upgrade pre-approved at 950 subscribers.
13. **Score drift.** Versioned prompt, auditor rolling holdout, weekly distribution comparison, escalation row.
14. **Thin or scaled content.** Unique data blocks on every page, noindex thresholds, 4-signal minimum, Fact Checker on guide text, Analyst watches indexation ([programmatic SEO 2026](https://alexcloudstar.com/blog/programmatic-seo-2026-indie-hackers/)).
15. **Weekly guide fatigue and misses.** Short format (5 shops, 300 words), unsubscribe rate watched per send; redraft loop and fallback page so a page always publishes; if unsubscribes exceed 0.5% for 3 sends the Analyst proposes a two-week rhythm as a `needs-human` escalation.
16. **Market.** Pivot gate in phase 2 with numbers; Dutch online product spend grew only 2% in 2025 ([Markt Monitor 2025](https://www.betaalvereniging.nl/en/news/more-online-product-purchases-less-spending-on-travel-and-events-in-2025/)).
17. **Abuse of the dispute form.** Signed confirmation to the shop's own domain before `removed`; edge rate limits per shop and per IP; `disputed` is the only instant effect.

## 15. First build tasks

1. Private repo from the starter, Vercel Pro, Supabase EU, Basic Auth middleware with public exemptions, `CLAUDE.md`, `DECISIONS.md`, CODEOWNERS, CI typecheck and vitest, branch protection, GitHub Environment for secrets bound to `main`. Check: green CI on an empty PR; unauthenticated request gets 401 on `/` and 200 on `/over`.
2. `claude-developer.yml` and `claude-reviewer.yml` (pinned release, Reviewer under its own GitHub App, `ready_for_review` and `labeled` triggers) with `ANTHROPIC_API_KEY`, `--max-turns`, timeouts, concurrency; `label-guard.yml`; `agents/developer` and `agents/reviewer` with `instructions.md`; `.claude/skills/` pointers. Check: an issue relabelled `agent-ok` by Stefan produces a reviewed PR; the Reviewer approval counts toward the required review; a bot-applied `agent-ok` fails CI. From here on, remaining tasks are filed as `agent-proposed` issues that Stefan relabels.
3. Migration 0001: `categories`, `shops` (with `contact_email`), `clicks`, `agent_runs`, `agent_settings`, `shops_public` with `security_invoker`, anon policy, revokes. Check: reset clean; anon sees zero draft rows; `agents_enabled` defaults to true.
4. `agents/shared/audit.ts`: `checkKillSwitch()`, `writeAgentRun()`, `budgetGuard()`, the `AGENTS_PAUSED` variable check; `kill-switch.yml` with `NOLOGIN`, `pg_terminate_backend` and password rotation. Check: a job exits early when the flag is false; a row appears per run; after the kill job an agent role cannot connect.
5. Migration 0002: `crawl_pages`, `shop_signals`. Check: reset clean.
6. Migration 0003: `scores`, `score_runs`, `score_checks`, `score_overrides`. Check: reset clean.
7. Migration 0004: `shop_candidates`, `source_lists`, `disputes`, `agent_escalations`, `agent_schedule`, `health_checks`. Check: reset clean.
8. Migration 0005: `subscribers`, `email_queue`, `outreach_drafts`, `commissions`, `search_console_daily`. Check: reset clean.
9. Migration 0006: per-agent login roles, grants, `WITH CHECK` policies, the `published` trigger, role tests. Check: every forbidden write in section 7 fails.
10. Source list import job and `agents/shop-scout` as a routine (daily 06:00, DB only); G6 queue in `/admin`; seed import from accepted candidates. Check: 60 accepted candidates become 60 `shops` rows with unique slugs.
11. `/go/[slug]` and `/over` with footer identity. Check: 302 and one `clicks` row. Apply to Daisycon.
12. `fetchPolite()` with robots, per-domain and Wayback limiters, fixture tests. Check: 3 fixture shops fetch without network.
13. Fetch step and rule extractors, one PR each: sitemap count; six platform fingerprints; KvK regex; role-address `contact_email` extractor; keurmerk badge-link verification; domain age. Check: fixture tests per extractor.
14. `scoreBatch()` and `collectBatches()` with structured outputs, quote normaliser, `weights.ts`, labels, maths tests. Check: 60 shops scored over two runs, cost and match rate logged.
15. `pipeline.yml` at 01:00 Europe/Amsterdam with the health row, `/api/revalidate` and `/api/health`. Check: two consecutive green nightly runs without a manual start.
16. `agents/score-auditor` as a routine (state-chained after the nightly run) with its own role, rubric prompt, `score_checks` writer, tuning escalation. Check: 60 audits, MAE reported in `agent_runs.summary`, one escalation filed as an `agent-proposed` issue by `escalations.yml`.
17. `health.yml`, `schedule-gaps.yml`, `escalations.yml`, `agents/ops-watchdog`, `digest.yml`. Check: a skipped routine triggers a gap email; the digest sends with "summary missing" when the Watchdog did not run.
18. Pages: `/webshop/[slug]`, category pages with ranking disclosure and `ItemList`, home. Check: Lighthouse mobile 90+ locally, Playwright at 390 px, screenshots posted as PR artifacts.

Next issues, one each: `/admin` with gates G1 to G6, kill switch, run log, gap view and unpause; sitemap and robots; double opt-in, welcome email and `email_queue` sender; `/herbeoordeling` form with the code-side `disputed`, signed confirmation link, `removed` path and edge rate limits; dispute reply templates and the slot validator; `agents/dispute-handler` (6-hourly, work-gated); pre-notice job; legal pages; PostHog; Search Console import job; `agents/seo-growth-analyst`; grow to 150 shops; remove Basic Auth. Phase 3 issues: migration 0007 `guide_issues`, `pin_drafts` and `guide_inputs` view; `agents/guide-editor`; `agents/fact-checker` with the `agent_factcheck` role; `guide.yml` with redraft loop, fallback page, publisher and sender; `/gids` pages; `/keurmerk/[slug]`; `tsvector` search; `agents/outreach`; `/api/stripe/webhook`; `data-validate.yml` and `automerge.yml`; Pinterest post job.

## What changed in v3

- Operating model: every recurring task has an owner agent; founder work reduced to one-time setup, six approval gates with exit criteria and time-boxed defaults, one unpause tap after a Watchdog pause, and a weekly digest.
- Added the agent roster (section 3), gates table (section 4), and repo layout for agents in an eve-portable shape (section 9).
- Score Auditor replaces founder hand-checks and the weekly 10 random checks; `human_checks` became `score_checks` with a `checker` column; the 30-40 band now waits for auditor agreement; phase 1 tuning is owned by the Auditor through proposals.
- Dispute handling split: `disputed` is instant by code; `removed` needs a signed confirmation link to the shop's own domain, then runs by code within 48 hours; the Dispute Handler verifies and fills reply templates only; score-changing corrections keep a human tap (G4) with a safe-direction default after 7 days.
- Guide is weekly: `/gids/[yyyy]-week-[ww]` with defined week semantics, Monday draft and fact check after the nightly run, redraft loop Tuesday and Wednesday, code fallback page, Thursday 10:00 send, about 4.3 sends per month, Resend Broadcasts free up to 1,000 contacts with the USD 40 upgrade pre-approved at 950, new guide metrics, "Vanaf [maand]" copy and welcome email until week 13.
- New tables: `agent_runs`, `agent_settings`, `guide_issues`, `shop_candidates`, `source_lists`, `score_overrides`, `outreach_drafts`, `pin_drafts`, `agent_escalations`, `agent_schedule`, `health_checks`, `search_console_daily`; `shops` gained `contact_email` and `contact_email_source`; `disputes` gained confirmation token, reply template and slot columns, and `deadline_at`; `email_queue` gained `shop_id`.
- Guardrails: per-agent Postgres login roles over the pooler with RLS `WITH CHECK` policies and a `published` trigger; separate `agent_factcheck` role; drafts-not-publishes; no GitHub or web connector in any routine; escalations become issues through code; human-only `agent-ok` with a CI guard; CODEOWNERS and a separate Reviewer GitHub App; auto-merge only for schema-validated data and content paths with `auto-merge-ok` set by code; hard kill job (`NOLOGIN`, terminate, rotate) plus soft guards; secrets in a `main`-bound Environment; pinned `claude-code-action`; hard spend limit in the Anthropic Console with USD 150 per month start; schedule gap alerts; code-built digest.
- Schedules written in Europe/Amsterdam with UTC crons generated; pipeline at 01:00; downstream jobs chain on `score_runs.status`; Dispute Handler and Watchdog run 6-hourly and only when there is work; Watchdog pauses alert at once and expire after 48 hours.
- Added gate G6 for new domains; Shop Scout starts in week 3 from code-imported lists; SEO/Growth Analyst moved to phase 2 with a Search Console API import; Pinterest pins go through `pin_drafts` and G3.
- Phase 4 EPC target corrected to EUR 0.13 per commission-capable click; gates target reads "G2 and G3 removed; G1 relaxed".
- Basic Auth exempts `/over`, `/privacy`, `/informatie-voor-webshops` and `/go/` so Daisycon can review; re-apply in week 9 if rejected.
- Stripe fulfilment via `/api/stripe/webhook`; Payment Links created once by Stefan; G5 wording "price changes and refunds".
- Migrations split into 0001 to 0006 (guide migration is 0007); `pipeline.yml` and the Watchdog moved ahead of the pages in the task list; search kept in phase 3 only; `email_queue` in MVP IN; `/herbeoordeling` named as the dispute route; `/keurmerk/[slug]` in phase 3; keurmerk queue renamed to a review queue.
- Added Google scaled content abuse mitigation: unique first-party data on every page.
- Vercel eve explicitly not used now; routines and `claude-code-action` chosen, with Managed Agents as fallback.

## Sources

- https://makerkit.dev/blog/tutorials/claude-code-routines-guide
- https://www.morphllm.com/claude-code-github-actions
- https://claude.com/blog/building-with-claude-managed-agents
- https://app.opencve.io/cve/CVE-2026-47751
- https://github.blog/changelog/2022-05-03-github-actions-prevent-github-actions-from-creating-and-approving-pull-requests/
- https://supabase.com/docs/guides/database/postgres/roles.md
- https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac
- https://alexcloudstar.com/blog/programmatic-seo-2026-indie-hackers/
- https://www.resend.com/pricing.md
- https://vercel.com/docs/deployment-protection/usage-and-pricing
- https://vercel.com/docs/limits/fair-use-guidelines
- https://vercel.com/templates/next.js/supabase
- https://platform.claude.com/docs/en/build-with-claude/batch-processing
- https://docs.github.com/en/actions/reference/usage-limits-billing-and-administration
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows
- https://supabase.com/docs/guides/auth/row-level-security
- https://daisycon.com/developers/api/resources/publisher-resources/
- https://daisycon.com/wp-content/uploads/2026/08/General-Terms-and-Conditions-for-Publisher-version-14.pdf
- https://daisycon.com/nl/campagnes/19319-meubella-nl
- https://faq-publisher.daisycon.com/hc/nl/articles/360002672318-Hoe-werkt-de-transactiekeuring
- https://faq-publisher.daisycon.com/hc/nl/articles/205960941
- https://www.thuiswinkel.org/en/safe-online-shopping/checking-trustmarks/
- https://whoapi.com/blog/exploring-nl-whois-the-digital-gateway-to-the-netherlands/
- https://cirosantilli.com/wayback-machine-rate-limit
- https://posthog.com/docs/privacy/cookieless-tracking
- https://wetboekplus.nl/burgerlijk-wetboek-boek-3-artikel-15d-dienst-informatiemaatschappij/
- https://vbk.nl/sites/default/files/documents/Marketing/Publicaties/Anouk%20Lankhaar_Bb%202022%2077%20_Transparantie%20vereist%20welke%20parameters%20bepalen%20de%20rangschikking%20van%20online%20zoekresultaten(1670076.1).pdf
- https://www.lexgo.be/en/news-and-articles/11892-the-omnibus-act-more-transparency-for-consumers
- https://iapp.org/news/a/netherlands-dpa-issues-guidance-against-web-scraping
- https://www.hlc.com/en/publications/cjeu-clears-the-air-dutch-dpas-interpretation-of-legitimate-interests-is-too-strict
- https://support.google.com/adspolicy/answer/16427718
- https://www.superads.ai/facebook-ads-costs/cost-per-lead/e-commerce/netherlands
- https://www.betaalvereniging.nl/en/news/more-online-product-purchases-less-spending-on-travel-and-events-in-2025/

## Review log

- Kill switch not a hard stop: applied. `kill-switch.yml` sets `NOLOGIN`, terminates backends and rotates passwords; `checkKillSwitch()` is marked soft; routines UI pause added as a runbook step (sections 4, 7, 9, task 4).
- Agent-to-agent chains reach production: applied. `agent-ok` is human-only, agents use `agent-proposed`, `label-guard.yml` fails bot-labelled PRs, pins go through G3 (sections 3, 4, 9, 11).
- Routines with GitHub write access: applied. No routine has GitHub or web; `agent_escalations` plus `escalations.yml`; secrets in a `main`-bound Environment; action pinned above CVE-2026-47751. The Hacker News article and version 1.0.94 could not be verified, so the plan cites the CVE record and the fix version 1.0.74 instead; the advice to never set `allowed_non_write_users` is kept because it costs nothing.
- Unverified removal path: applied. `disputed` instant, signed confirmation link to the shop domain before `removed`, edge rate limits (section 7 step 9, section 14).
- Per-agent roles through the Supabase API: applied. Login roles over the pooler, `WITH CHECK` policies, `published` trigger, role tests in task 9. One correction to the issue text: `GRANT INSERT` without `UPDATE` does give insert-only; the plan still adds policies because value rules need them.
- Dispute reply loop sends agent text: applied. Template id plus typed slots, validator rejects internal signal names and foreign URLs, free text only in `resolved_note`.
- Shop Scout publishes unseen domains: applied. Gate G6 with weekly batch tap and 100-candidate exit criterion.
- Reviewer approval cannot satisfy branch protection: applied, merged with the medium CODEOWNERS issue. Separate Reviewer GitHub App, repository setting enabled, CODEOWNERS for human paths, "twice in a row" rule dropped.
- Analyst needed in phase 2: applied. Analyst and Search Console API import moved to phase 2 and MVP IN.
- No contact email stored: applied. `shops.contact_email` and `contact_email_source` with role-address rule, `email_queue.shop_id`, LIA note.
- G4 default breaks the promise (two issues): applied as one time-boxed default: after 7 days code applies safe-direction overrides or hides the score and emails the shop; re-publication keeps the tap.
- EPC target contradiction: applied. Target is EUR 0.13 per commission-capable click, about EUR 13 per 100 clicks.
- Shop Scout and Watchdog need the web: applied by the stricter option. Code imports source lists and runs health checks into tables; both agents read DB only.