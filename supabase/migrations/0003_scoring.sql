-- 0003 scoring: score_runs, scores, score_checks, score_overrides (plan v3 section 7).
-- Only the pipeline role writes scores (grants in 0006). Internal tables, no anon access.

create table public.score_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  batch_id text,
  batch_status text check (batch_status in ('submitted', 'in_progress', 'ended', 'canceled', 'expired', 'collected')),
  shops_submitted integer not null default 0 check (shops_submitted >= 0),
  shops_scored integer not null default 0 check (shops_scored >= 0),
  parse_failures integer not null default 0 check (parse_failures >= 0),
  quote_match_rate numeric(4, 3) check (quote_match_rate between 0 and 1),
  cost_usd numeric(10, 4) check (cost_usd >= 0),
  status text not null default 'running' check (status in ('running', 'ok', 'failed'))
);
create index score_runs_started_at_idx on public.score_runs (started_at desc);

alter table public.shop_signals
  add constraint shop_signals_run_id_fkey foreign key (run_id) references public.score_runs (id) on delete set null;

create table public.score_overrides (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  proposed_by text not null check (proposed_by in ('agent', 'human')),
  old_total smallint check (old_total between 1 and 100),
  new_total smallint check (new_total between 1 and 100),
  reason text not null,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'rejected', 'applied', 'applied_by_default')),
  approved_by text,
  created_at timestamptz not null default now()
);
create index score_overrides_shop_status_idx on public.score_overrides (shop_id, status);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  run_id uuid references public.score_runs (id) on delete set null,
  score_version text not null,
  total smallint not null check (total between 1 and 100),
  sub_scores jsonb not null default '{}'::jsonb,
  caps_applied text[] not null default '{}',
  model text,
  prompt_version text,
  override_id uuid references public.score_overrides (id) on delete set null,
  created_at timestamptz not null default now()
);
create index scores_shop_created_idx on public.scores (shop_id, created_at desc);

create table public.score_checks (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  checker text not null check (checker in ('auditor', 'human')),
  checker_model text,
  checker_prompt_version text,
  check_total smallint check (check_total between 1 and 100),
  sub_scores jsonb not null default '{}'::jsonb,
  delta smallint,
  holdout boolean not null default false,
  verdict text not null check (verdict in ('agree', 'review', 'escalate')),
  note text,
  checked_at timestamptz not null default now()
);
create index score_checks_shop_checked_idx on public.score_checks (shop_id, checked_at desc);

alter table public.score_runs enable row level security;
alter table public.scores enable row level security;
alter table public.score_checks enable row level security;
alter table public.score_overrides enable row level security;
revoke all on public.score_runs, public.scores, public.score_checks, public.score_overrides
  from anon, authenticated;
