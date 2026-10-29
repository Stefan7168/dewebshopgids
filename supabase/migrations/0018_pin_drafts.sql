-- 0018: Pinterest pin drafts (plan v3 sections 3, 4 and 11). The SEO/Growth Analyst drafts up to
-- 10 pins a week that link to our own pages (never straight to a shop or an affiliate link);
-- Stefan approves a batch in /admin/pins (gate G3); a code job posts approved pins through the
-- Pinterest API once the Pinterest app exists. Internal table, no anon access.
create table public.pin_drafts (
  id uuid primary key default gen_random_uuid(),
  -- Our own page only: a shop page, a /beste list, a gids issue or a category.
  target_path text not null check (target_path ~ '^/(webshop|beste|gids|categorie)/[a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 5 and 100),
  description text not null check (char_length(description) between 20 and 500),
  board text not null check (board ~ '^[a-z0-9-]{1,40}$'),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'posted', 'expired')),
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  approved_by text,
  decided_at timestamptz,
  posted_at timestamptz,
  pinterest_pin_id text,
  created_at timestamptz not null default now()
);
create index pin_drafts_status_idx on public.pin_drafts (status, created_at);

alter table public.pin_drafts enable row level security;
revoke all on public.pin_drafts from anon, authenticated;

-- Analyst: read its drafts (to avoid repeats) and insert new drafts only.
grant select on public.pin_drafts to agent_analyst;
grant insert (target_path, title, description, board, agent_run_id) on public.pin_drafts to agent_analyst;
create policy pin_drafts_analyst_read on public.pin_drafts for select to agent_analyst using (true);
create policy pin_drafts_analyst_insert on public.pin_drafts for insert to agent_analyst with check (status = 'draft');

-- Post job (pipeline role): read approved drafts and mark them posted, nothing else.
grant select on public.pin_drafts to pipeline;
grant update (status, posted_at, pinterest_pin_id) on public.pin_drafts to pipeline;
create policy pin_drafts_pipeline_read on public.pin_drafts for select to pipeline using (true);
create policy pin_drafts_pipeline_post on public.pin_drafts for update to pipeline
  using (status = 'approved') with check (status in ('approved', 'posted'));
