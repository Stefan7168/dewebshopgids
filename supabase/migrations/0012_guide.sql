-- 0012: the weekly gids (plan v3 sections 2.6, 3, 7 and 8 step 12).
-- One guide_issues row per ISO week. Code (pipeline role) creates it with a frozen
-- inputs_snapshot, the Guide Editor writes only the draft columns, the Fact Checker writes
-- only its report and the verdict, and code publishes and sends. Anon reads published
-- guides through guides_public. Additive only.

create table public.guide_issues (
  id uuid primary key default gen_random_uuid(),
  iso_year smallint not null check (iso_year between 2026 and 2100),
  iso_week smallint not null check (iso_week between 1 and 53),
  slug text not null unique check (slug ~ '^\d{4}-week-\d{2}$'),
  title_nl text check (char_length(title_nl) <= 120),
  intro_nl text check (char_length(intro_nl) <= 600),
  body_md text check (char_length(body_md) <= 6000),
  shop_ids uuid[] not null default '{}' check (cardinality(shop_ids) <= 5),
  -- The only data the Editor and the Fact Checker may use, frozen when the row is created.
  inputs_snapshot jsonb not null check (jsonb_typeof(inputs_snapshot) = 'object'),
  status text not null default 'draft'
    check (status in ('draft', 'fact_checked', 'rejected', 'approved', 'published', 'sent', 'fallback')),
  redraft_count smallint not null default 0 check (redraft_count between 0 and 2),
  fact_check_report jsonb,
  drafted_at timestamptz,
  checked_at timestamptz,
  approved_by text,
  resend_broadcast_id text,
  published_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (iso_year, iso_week)
);
create trigger guide_issues_set_updated_at before update on public.guide_issues
  for each row execute function public.set_updated_at();

-- drafted_at is set by the database, not by the Editor, whenever the draft text changes.
create or replace function public.guide_issues_drafted_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.title_nl is distinct from old.title_nl or new.intro_nl is distinct from old.intro_nl
     or new.body_md is distinct from old.body_md or new.shop_ids is distinct from old.shop_ids then
    new.drafted_at = now();
  end if;
  return new;
end;
$$;
create trigger guide_issues_drafted_at before update on public.guide_issues
  for each row execute function public.guide_issues_drafted_at();

alter table public.guide_issues enable row level security;
revoke all on public.guide_issues from anon, authenticated;

-- Public: published guides only, through the view.
create policy guide_issues_public_read on public.guide_issues
  for select to anon, authenticated using (status in ('published', 'sent', 'fallback'));
create view public.guides_public with (security_invoker = true) as
  select id, iso_year, iso_week, slug, title_nl, intro_nl, body_md, shop_ids, status, published_at
  from public.guide_issues
  where status in ('published', 'sent', 'fallback');
revoke all on public.guides_public from anon, authenticated;
grant select on public.guides_public to anon, authenticated;
grant select (id, iso_year, iso_week, slug, title_nl, intro_nl, body_md, shop_ids, status, published_at)
  on public.guide_issues to anon, authenticated;

-- The fixed input for both agents: open issues and their frozen data.
create view public.guide_inputs with (security_invoker = true) as
  select id, slug, iso_year, iso_week, status, redraft_count, inputs_snapshot, fact_check_report, drafted_at, checked_at
  from public.guide_issues
  where status in ('draft', 'rejected');

-- Guide Editor: reads the inputs, writes draft text only while the issue is open.
grant select on public.guide_issues, public.guide_inputs to agent_guide;
grant update (title_nl, intro_nl, body_md, shop_ids) on public.guide_issues to agent_guide;
create policy guide_issues_editor_read on public.guide_issues for select to agent_guide using (true);
create policy guide_issues_editor_draft on public.guide_issues for update to agent_guide
  using (status in ('draft', 'rejected')) with check (status in ('draft', 'rejected'));

-- Fact Checker: reads, writes its report and the verdict, never the text.
grant select on public.guide_issues, public.guide_inputs to agent_factcheck;
grant update (fact_check_report, status, checked_at) on public.guide_issues to agent_factcheck;
create policy guide_issues_factcheck_read on public.guide_issues for select to agent_factcheck using (true);
create policy guide_issues_factcheck_verdict on public.guide_issues for update to agent_factcheck
  using (status in ('draft', 'rejected')) with check (status in ('fact_checked', 'rejected'));

-- agent_runs, agent_settings and agent_escalations grants for both roles are in 0006.

-- Pipeline: creates issues, freezes inputs, publishes and sends.
grant select, insert, update on public.guide_issues to pipeline;
grant select on public.guide_inputs to pipeline;
create policy guide_issues_pipeline_all on public.guide_issues for all to pipeline using (true) with check (true);
