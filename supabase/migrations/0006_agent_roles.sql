-- 0006 agent roles: one Postgres role per agent plus `pipeline`, least-privilege
-- grants, WITH CHECK policies, and the trigger that lets only `pipeline` publish.
-- Plan v3 sections 3 and 7.
--
-- Roles are created NOLOGIN with no password. scripts/agents/set-role-password.ts
-- enables login and sets a password that lives only in that agent's routine or
-- workflow secret. kill-switch.yml turns them back to NOLOGIN.
-- guide_issues and pin_drafts arrive in a later migration (phase 3), with their grants.

do $$
declare r text;
begin
  foreach r in array array['pipeline', 'agent_scout', 'agent_auditor', 'agent_dispute', 'agent_guide',
                           'agent_factcheck', 'agent_outreach', 'agent_analyst', 'agent_ops'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin noinherit', r);
    end if;
    execute format('grant usage on schema public to %I', r);
  end loop;
end $$;

-- Agent name written in agent_runs for each role.
create or replace function public.current_agent()
returns text
language sql
stable
set search_path = ''
as $$
  select case current_user
    when 'agent_scout' then 'shop-scout'
    when 'agent_auditor' then 'score-auditor'
    when 'agent_dispute' then 'dispute-handler'
    when 'agent_guide' then 'guide-editor'
    when 'agent_factcheck' then 'fact-checker'
    when 'agent_outreach' then 'outreach'
    when 'agent_analyst' then 'seo-growth-analyst'
    when 'agent_ops' then 'ops-watchdog'
    else null
  end
$$;

-- Only `pipeline` may set shops.status = 'published' (the publish job).
create or replace function public.guard_shop_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and current_user <> 'pipeline' then
    raise exception 'only the pipeline role may publish a shop (current_user = %)', current_user
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
create trigger shops_guard_publish before insert or update of status on public.shops
  for each row execute function public.guard_shop_publish();

-- Shared by every agent role: read the guards, write its own agent_runs rows.
do $$
declare r text;
begin
  foreach r in array array['agent_scout', 'agent_auditor', 'agent_dispute', 'agent_guide',
                           'agent_factcheck', 'agent_outreach', 'agent_analyst', 'agent_ops'] loop
    execute format('grant select on public.agent_settings to %I', r);
    execute format('grant select, insert, update (finished_at, status, output_refs, tokens_in, tokens_out, cost_usd_est, summary, error) on public.agent_runs to %I', r);
  end loop;
end $$;

create policy agent_settings_agents_read on public.agent_settings for select
  to agent_scout, agent_auditor, agent_dispute, agent_guide, agent_factcheck, agent_outreach, agent_analyst, agent_ops
  using (true);
create policy agent_runs_own_read on public.agent_runs for select
  to agent_scout, agent_auditor, agent_dispute, agent_guide, agent_factcheck, agent_outreach, agent_ops
  using (agent = public.current_agent());
create policy agent_runs_analyst_read on public.agent_runs for select to agent_analyst using (true);
create policy agent_runs_own_insert on public.agent_runs for insert
  to agent_scout, agent_auditor, agent_dispute, agent_guide, agent_factcheck, agent_outreach, agent_analyst, agent_ops
  with check (agent = public.current_agent() and runs_on = 'routine');
create policy agent_runs_own_update on public.agent_runs for update
  to agent_scout, agent_auditor, agent_dispute, agent_guide, agent_factcheck, agent_outreach, agent_analyst, agent_ops
  using (agent = public.current_agent()) with check (agent = public.current_agent());

-- Escalations: every agent may file one; code files the GitHub issue.
grant insert on public.agent_escalations to agent_scout, agent_auditor, agent_dispute, agent_guide,
  agent_factcheck, agent_outreach, agent_analyst, agent_ops;
create policy agent_escalations_insert on public.agent_escalations for insert
  to agent_scout, agent_auditor, agent_dispute, agent_guide, agent_factcheck, agent_outreach, agent_analyst, agent_ops
  with check (agent = public.current_agent() and status = 'new' and github_issue_url is null);

-- No agent role is ever granted shops.contact_email, shops.score updates, or writes on scores.

-- Shop Scout ------------------------------------------------------------------
grant select on public.source_lists, public.categories to agent_scout;
grant select (id, domain, name, status) on public.shops to agent_scout;
grant select, insert (domain, name, source, reason, suggested_category_id, agent_run_id)
  on public.shop_candidates to agent_scout;
create policy source_lists_scout_read on public.source_lists for select to agent_scout using (true);
create policy categories_scout_read on public.categories for select to agent_scout using (true);
create policy shops_scout_read on public.shops for select to agent_scout using (true);
create policy shop_candidates_scout_read on public.shop_candidates for select to agent_scout using (true);
create policy shop_candidates_scout_insert on public.shop_candidates for insert to agent_scout
  with check (status = 'new' and decided_by is null);

-- Score Auditor ---------------------------------------------------------------
grant select (
  id, slug, name, domain, category_id, platform, product_count_est, product_count_method,
  domain_first_seen, domain_age_sources, keurmerk, keurmerk_status, keurmerk_verified_method,
  affiliate_available, price_level, has_physical_store, store_city, ships_from_country,
  score, score_version, score_label, status, description_nl, created_at, updated_at
) on public.shops to agent_auditor;
grant update (status, keurmerk_status, keurmerk_verified_method) on public.shops to agent_auditor;
grant select on public.crawl_pages, public.shop_signals, public.scores, public.score_runs,
  public.score_checks, public.categories to agent_auditor;
grant insert on public.score_checks to agent_auditor;
create policy shops_auditor_read on public.shops for select to agent_auditor using (true);
create policy shops_auditor_update on public.shops for update to agent_auditor
  using (status in ('draft', 'hidden')) with check (status in ('draft', 'hidden'));
create policy crawl_pages_auditor_read on public.crawl_pages for select to agent_auditor using (true);
create policy shop_signals_auditor_read on public.shop_signals for select to agent_auditor using (true);
create policy scores_auditor_read on public.scores for select to agent_auditor using (true);
create policy score_runs_auditor_read on public.score_runs for select to agent_auditor using (true);
create policy score_checks_auditor_read on public.score_checks for select to agent_auditor using (true);
create policy score_checks_auditor_insert on public.score_checks for insert to agent_auditor
  with check (checker = 'auditor');
create policy categories_auditor_read on public.categories for select to agent_auditor using (true);

-- Dispute Handler -------------------------------------------------------------
grant select (id, slug, name, domain, status, score, score_version, keurmerk, keurmerk_status,
  product_count_est, domain_first_seen, description_nl) on public.shops to agent_dispute;
grant select on public.shop_signals, public.scores, public.score_overrides to agent_dispute;
grant select (id, shop_id, confirmed_at, message, type, status, reply_template_id, reply_slots,
  resolved_note, deadline_at, created_at) on public.disputes to agent_dispute;
grant update (status, resolved_note, reply_template_id, reply_slots, agent_run_id) on public.disputes to agent_dispute;
grant insert (shop_id, proposed_by, old_total, new_total, reason) on public.score_overrides to agent_dispute;
create policy shops_dispute_read on public.shops for select to agent_dispute using (true);
create policy shop_signals_dispute_read on public.shop_signals for select to agent_dispute using (true);
create policy scores_dispute_read on public.scores for select to agent_dispute using (true);
create policy score_overrides_dispute_read on public.score_overrides for select to agent_dispute using (true);
create policy score_overrides_dispute_insert on public.score_overrides for insert to agent_dispute
  with check (proposed_by = 'agent' and status = 'draft' and approved_by is null);
create policy disputes_dispute_read on public.disputes for select to agent_dispute using (true);
create policy disputes_dispute_update on public.disputes for update to agent_dispute
  using (status in ('open', 'agent_replied', 'awaiting_human'))
  with check (status in ('agent_replied', 'awaiting_human'));

-- Outreach --------------------------------------------------------------------
grant select (id, slug, name, domain, category_id, status, score, affiliate_available,
  verified_badge_until, description_nl) on public.shops to agent_outreach;
grant select on public.clicks, public.outreach_drafts to agent_outreach;
grant insert (shop_id, kind, subject, body_md, agent_run_id) on public.outreach_drafts to agent_outreach;
create policy shops_outreach_read on public.shops for select to agent_outreach using (status = 'published');
create policy clicks_outreach_read on public.clicks for select to agent_outreach using (true);
create policy outreach_drafts_outreach_read on public.outreach_drafts for select to agent_outreach using (true);
create policy outreach_drafts_outreach_insert on public.outreach_drafts for insert to agent_outreach
  with check (status = 'draft' and approved_by is null);

-- SEO/Growth Analyst: read-only, no personal or contact data -------------------
grant select (id, slug, name, domain, category_id, platform, product_count_est, domain_first_seen,
  keurmerk, keurmerk_status, affiliate_available, price_level, score, score_label, status,
  description_nl, created_at, updated_at) on public.shops to agent_analyst;
grant select on public.categories, public.clicks, public.scores, public.score_runs,
  public.search_console_daily, public.commissions, public.health_checks to agent_analyst;
create policy shops_analyst_read on public.shops for select to agent_analyst using (true);
create policy categories_analyst_read on public.categories for select to agent_analyst using (true);
create policy clicks_analyst_read on public.clicks for select to agent_analyst using (true);
create policy scores_analyst_read on public.scores for select to agent_analyst using (true);
create policy score_runs_analyst_read on public.score_runs for select to agent_analyst using (true);
create policy search_console_analyst_read on public.search_console_daily for select to agent_analyst using (true);
create policy commissions_analyst_read on public.commissions for select to agent_analyst using (true);
create policy health_checks_analyst_read on public.health_checks for select to agent_analyst using (true);

-- Ops Watchdog: may pause, never unpause --------------------------------------
grant select on public.health_checks, public.agent_schedule to agent_ops;
grant select on public.agent_runs to agent_ops;
create policy agent_runs_ops_read_all on public.agent_runs for select to agent_ops using (true);
grant insert, update (value) on public.agent_settings to agent_ops;
grant insert ("to", template, slots, priority) on public.email_queue to agent_ops;
create policy health_checks_ops_read on public.health_checks for select to agent_ops using (true);
create policy agent_schedule_ops_read on public.agent_schedule for select to agent_ops using (true);
create policy agent_settings_ops_pause_insert on public.agent_settings for insert to agent_ops
  with check (
    (key like 'enabled.%' and value = 'false'::jsonb)
    or (key like 'paused_until.%' and jsonb_typeof(value) = 'string' and (value #>> '{}')::timestamptz > now())
  );
create policy agent_settings_ops_pause_update on public.agent_settings for update to agent_ops
  using (key like 'enabled.%' or key like 'paused_until.%')
  with check (
    (key like 'enabled.%' and value = 'false'::jsonb)
    or (key like 'paused_until.%' and jsonb_typeof(value) = 'string' and (value #>> '{}')::timestamptz > now())
  );
-- Ops alerts go to the site owner only: "to" is the fixed placeholder 'owner',
-- which the email sender resolves from the OWNER_EMAIL secret.
create policy email_queue_ops_insert on public.email_queue for insert to agent_ops
  with check ("to" = 'owner' and shop_id is null and template in ('ops_pause_alert', 'digest_summary'));

-- Guide Editor and Fact Checker: grants arrive with guide_issues (phase 3).

-- Pipeline (deterministic code): read and write the pipeline tables -------------
do $$
declare t text;
begin
  foreach t in array array['categories', 'shops', 'clicks', 'crawl_pages', 'shop_signals', 'score_runs',
                           'scores', 'score_checks', 'score_overrides', 'shop_candidates', 'source_lists',
                           'disputes', 'agent_escalations', 'agent_schedule', 'health_checks', 'agent_runs',
                           'agent_settings', 'email_queue', 'outreach_drafts', 'commissions',
                           'search_console_daily'] loop
    execute format('grant select, insert, update on public.%I to pipeline', t);
    execute format('create policy %I on public.%I for all to pipeline using (true) with check (true)',
                   t || '_pipeline_all', t);
  end loop;
end $$;
grant delete on public.crawl_pages to pipeline; -- 90-day retention
grant usage on all sequences in schema public to pipeline;
-- shop_signals is append only, also for the pipeline.
revoke update on public.shop_signals from pipeline;
