-- 0004 operations: shop_candidates, source_lists, disputes, agent_escalations,
-- agent_schedule, health_checks (plan v3 section 7). Internal tables, no anon access.
-- Dispute submissions are written by server code (service role), never from the browser.

create table public.source_lists (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('thuiswinkel', 'daisycon', 'directory')),
  domain text not null check (domain = lower(domain) and domain !~ '/'),
  name text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  unique (source, domain)
);

create table public.shop_candidates (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique check (domain = lower(domain) and domain !~ '/'),
  name text,
  source text not null,
  reason text,
  suggested_category_id uuid references public.categories (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'accepted', 'rejected', 'duplicate')),
  decided_by text,
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  created_at timestamptz not null default now()
);
create index shop_candidates_status_idx on public.shop_candidates (status, created_at);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  email text not null,
  confirm_token_hash text,
  confirmed_at timestamptz,
  -- Untrusted data.
  message text check (char_length(message) <= 5000),
  type text not null check (type in ('prenotice', 'correction', 'removal', 'objection', 'claim')),
  status text not null default 'open'
    check (status in ('open', 'awaiting_confirmation', 'agent_replied', 'awaiting_human', 'resolved')),
  reply_template_id text,
  reply_slots jsonb,
  resolved_note text,
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  deadline_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index disputes_status_deadline_idx on public.disputes (status, deadline_at);
create index disputes_shop_id_idx on public.disputes (shop_id);

create table public.agent_escalations (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  kind text not null,
  title text not null check (char_length(title) <= 200),
  body_md text not null,
  label text not null default 'agent-proposed' check (label in ('agent-proposed', 'needs-human')),
  github_issue_url text,
  status text not null default 'new' check (status in ('new', 'filed', 'closed')),
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  created_at timestamptz not null default now()
);
create index agent_escalations_status_idx on public.agent_escalations (status, created_at);

create table public.agent_schedule (
  agent text primary key,
  cron text not null,
  timezone text not null default 'Europe/Amsterdam',
  max_gap_minutes integer not null check (max_gap_minutes > 0)
);

create table public.health_checks (
  id uuid primary key default gen_random_uuid(),
  "check" text not null
    check ("check" in ('health_endpoint', 'vercel_status', 'supabase_status', 'failed_runs', 'token_spend', 'screenshots', 'schedule_gap')),
  status text not null check (status in ('ok', 'warn', 'fail')),
  detail jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);
create index health_checks_check_checked_idx on public.health_checks ("check", checked_at desc);

alter table public.source_lists enable row level security;
alter table public.shop_candidates enable row level security;
alter table public.disputes enable row level security;
alter table public.agent_escalations enable row level security;
alter table public.agent_schedule enable row level security;
alter table public.health_checks enable row level security;
revoke all on public.source_lists, public.shop_candidates, public.disputes,
  public.agent_escalations, public.agent_schedule, public.health_checks
  from anon, authenticated;
