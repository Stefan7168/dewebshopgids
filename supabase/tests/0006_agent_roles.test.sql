-- Role tests for 0006: every forbidden write from plan section 7 must fail.
begin;

insert into public.categories (slug, name_nl) values ('test-cat', 'Test');
insert into public.shops (slug, name, domain, category_id, status, contact_email, score)
values ('a', 'A', 'a.nl', (select id from public.categories where slug = 'test-cat'), 'draft', 'info@a.nl', 50),
       ('h', 'H', 'h.nl', (select id from public.categories where slug = 'test-cat'), 'hidden', null, 40);
insert into public.disputes (shop_id, email, type) values ((select id from public.shops where slug = 'a'), 'info@a.nl', 'correction');

-- Helper: run a statement as a role and require that it fails.
create function pg_temp.must_fail(r text, stmt text) returns void language plpgsql as $$
begin
  execute format('set local role %I', r);
  begin
    execute stmt;
  exception when others then
    reset role;
    return;
  end;
  reset role;
  raise exception 'expected failure as %: %', r, stmt;
end $$;

create function pg_temp.must_pass(r text, stmt text) returns void language plpgsql as $$
begin
  execute format('set local role %I', r);
  execute stmt;
  reset role;
end $$;

-- Only pipeline publishes; service_role and postgres cannot.
select pg_temp.must_fail('agent_auditor', $$update public.shops set status = 'published' where slug = 'a'$$);
select pg_temp.must_fail('service_role', $$update public.shops set status = 'published' where slug = 'a'$$);
select pg_temp.must_pass('pipeline', $$update public.shops set status = 'published' where slug = 'a'$$);
do $$ begin
  assert (select status from public.shops where slug = 'a') = 'published', 'pipeline publish failed';
end $$;

-- Auditor: may move hidden <-> draft only; cannot touch published rows or the score.
select pg_temp.must_pass('agent_auditor', $$update public.shops set status = 'draft' where slug = 'h'$$);
select pg_temp.must_fail('agent_auditor', $$update public.shops set status = 'removed' where slug = 'h'$$);
do $$ begin
  set local role agent_auditor;
  update public.shops set status = 'hidden' where slug = 'a'; -- published row: policy filters it out
  reset role;
  assert (select status from public.shops where slug = 'a') = 'published', 'auditor changed a published shop';
end $$;
select pg_temp.must_fail('agent_auditor', $$update public.shops set score = 99 where slug = 'h'$$);
select pg_temp.must_fail('agent_auditor', $$insert into public.scores (shop_id, score_version, total) select id, 'v1', 50 from public.shops where slug = 'h'$$);
select pg_temp.must_fail('agent_auditor', $$select contact_email from public.shops$$);
select pg_temp.must_pass('agent_auditor', $$insert into public.score_checks (shop_id, checker, check_total, verdict) select id, 'auditor', 55, 'agree' from public.shops where slug = 'h'$$);

-- No agent role can update shops.score or write scores.
select pg_temp.must_fail(r, $$update public.shops set score = 1$$)
  from unnest(array['agent_scout', 'agent_auditor', 'agent_dispute', 'agent_guide', 'agent_factcheck',
                    'agent_outreach', 'agent_analyst', 'agent_ops']) r;
select pg_temp.must_fail(r, $$insert into public.scores (shop_id, score_version, total) select id, 'v1', 50 from public.shops limit 1$$)
  from unnest(array['agent_scout', 'agent_auditor', 'agent_dispute', 'agent_guide', 'agent_factcheck',
                    'agent_outreach', 'agent_analyst', 'agent_ops']) r;
select pg_temp.must_pass('pipeline', $$insert into public.scores (shop_id, score_version, total) select id, 'v1', 50 from public.shops where slug = 'a'$$);

-- Shop Scout: inserts new candidates only.
select pg_temp.must_pass('agent_scout', $$insert into public.shop_candidates (domain, name, source) values ('nieuw.nl', 'Nieuw', 'thuiswinkel')$$);
select pg_temp.must_fail('agent_scout', $$insert into public.shop_candidates (domain, source, status) values ('x.nl', 'thuiswinkel', 'accepted')$$);
select pg_temp.must_fail('agent_scout', $$update public.shop_candidates set status = 'accepted'$$);
select pg_temp.must_fail('agent_scout', $$insert into public.shops (slug, name, domain) values ('z', 'Z', 'z.nl')$$);

-- Dispute Handler: draft overrides only; cannot resolve or see the submitter email.
select pg_temp.must_pass('agent_dispute', $$insert into public.score_overrides (shop_id, proposed_by, old_total, new_total, reason) select id, 'agent', 50, 45, 'test' from public.shops where slug = 'a'$$);
select pg_temp.must_fail('agent_dispute', $$insert into public.score_overrides (shop_id, proposed_by, new_total, reason, status) select id, 'agent', 45, 'x', 'approved' from public.shops where slug = 'a'$$);
select pg_temp.must_pass('agent_dispute', $$update public.disputes set status = 'agent_replied', resolved_note = 'checked'$$);
select pg_temp.must_fail('agent_dispute', $$update public.disputes set status = 'resolved'$$);
select pg_temp.must_fail('agent_dispute', $$select email from public.disputes$$);

-- Outreach: drafts only.
select pg_temp.must_pass('agent_outreach', $$insert into public.outreach_drafts (shop_id, kind, subject, body_md) select id, 'badge_offer', 'Hoi', 'tekst' from public.shops where slug = 'a'$$);
select pg_temp.must_fail('agent_outreach', $$insert into public.outreach_drafts (shop_id, kind, subject, body_md, status) select id, 'badge_offer', 'Hoi', 'x', 'approved' from public.shops where slug = 'a'$$);
select pg_temp.must_fail('agent_outreach', $$insert into public.email_queue ("to", template) values ('x@y.nl', 'badge_offer')$$);

-- Analyst: read-only.
select pg_temp.must_pass('agent_analyst', $$select count(*) from public.clicks$$);
select pg_temp.must_fail('agent_analyst', $$select contact_email from public.shops$$);
select pg_temp.must_fail('agent_analyst', $$select * from public.disputes$$);
select pg_temp.must_fail('agent_analyst', $$update public.shops set description_nl = 'x'$$);

-- Ops Watchdog: may pause, never unpause.
select pg_temp.must_pass('agent_ops', $$insert into public.agent_settings (key, value) values ('enabled.shop-scout', 'false')$$);
select pg_temp.must_fail('agent_ops', $$update public.agent_settings set value = 'true' where key = 'enabled.shop-scout'$$);
do $$ begin
  set local role agent_ops;
  update public.agent_settings set value = 'false' where key = 'agents_enabled'; -- filtered by policy
  reset role;
  assert (select value from public.agent_settings where key = 'agents_enabled') = 'true'::jsonb,
    'ops must not change the global switch';
end $$;
select pg_temp.must_fail('agent_ops', $$insert into public.agent_settings (key, value) values ('paused_until.outreach', '"2000-01-01T00:00:00Z"')$$);
select pg_temp.must_pass('agent_ops', $$insert into public.email_queue ("to", template) values ('owner', 'ops_pause_alert')$$);
select pg_temp.must_fail('agent_ops', $$insert into public.email_queue ("to", template) values ('someone@else.nl', 'ops_pause_alert')$$);

-- agent_runs: an agent writes rows only under its own name.
select pg_temp.must_pass('agent_scout', $$insert into public.agent_runs (agent, runs_on) values ('shop-scout', 'routine')$$);
select pg_temp.must_fail('agent_scout', $$insert into public.agent_runs (agent, runs_on) values ('score-auditor', 'routine')$$);

-- Escalations: own name, status new.
select pg_temp.must_pass('agent_auditor', $$insert into public.agent_escalations (agent, kind, title, body_md) values ('score-auditor', 'tuning', 't', 'b')$$);
select pg_temp.must_fail('agent_auditor', $$insert into public.agent_escalations (agent, kind, title, body_md, status) values ('score-auditor', 'tuning', 't', 'b', 'filed')$$);

-- shop_signals is append only, even for the pipeline.
select pg_temp.must_pass('pipeline', $$insert into public.shop_signals (shop_id, signal_key, value_bool, source) select id, 'has_kvk', true, 'rule' from public.shops where slug = 'a'$$);
select pg_temp.must_fail('pipeline', $$update public.shop_signals set value_bool = false$$);

-- Every role is NOLOGIN until set-role-password.ts enables it.
do $$ begin
  assert not exists (select 1 from pg_roles where rolname in ('pipeline', 'agent_scout', 'agent_auditor',
    'agent_dispute', 'agent_guide', 'agent_factcheck', 'agent_outreach', 'agent_analyst', 'agent_ops') and rolcanlogin),
    'agent roles must be created NOLOGIN';
end $$;

rollback;
