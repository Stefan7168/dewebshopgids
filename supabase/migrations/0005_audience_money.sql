-- 0005 audience and money: subscribers, email_queue, outreach_drafts, commissions,
-- search_console_daily (plan v3 section 7). Internal tables, no anon access.

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  -- The email address itself lives in Resend; we keep only a token hash for confirm/unsubscribe links.
  token_hash text not null unique,
  confirmed_at timestamptz,
  resend_contact_id text unique,
  source_path text,
  created_at timestamptz not null default now()
);

create table public.email_queue (
  id uuid primary key default gen_random_uuid(),
  -- Null for shop emails: the recipient is resolved from shops.contact_email at send time.
  "to" text,
  shop_id uuid references public.shops (id) on delete cascade,
  template text not null check (template ~ '^[a-z][a-z0-9_]*$'),
  slots jsonb not null default '{}'::jsonb,
  priority smallint not null default 5 check (priority between 1 and 9),
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  check ("to" is not null or shop_id is not null)
);
create index email_queue_pending_idx on public.email_queue (priority, send_after) where sent_at is null;

create table public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  kind text not null check (kind in ('badge_offer', 'uitgelicht_offer', 'follow_up')),
  subject text not null check (char_length(subject) <= 150),
  body_md text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'queued', 'sent', 'expired')),
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  approved_by text,
  created_at timestamptz not null default now()
);
create index outreach_drafts_status_idx on public.outreach_drafts (status, created_at);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops (id) on delete set null,
  network text not null check (network in ('daisycon', 'tradetracker', 'awin', 'other')),
  network_transaction_id text,
  amount_eur numeric(10, 2) not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'paid')),
  reported_at timestamptz not null default now(),
  unique (network, network_transaction_id)
);
create index commissions_reported_at_idx on public.commissions (reported_at desc);

create table public.search_console_daily (
  date date not null,
  page text not null,
  query text not null default '',
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric(6, 5),
  position numeric(6, 2),
  primary key (date, page, query)
);

alter table public.subscribers enable row level security;
alter table public.email_queue enable row level security;
alter table public.outreach_drafts enable row level security;
alter table public.commissions enable row level security;
alter table public.search_console_daily enable row level security;
revoke all on public.subscribers, public.email_queue, public.outreach_drafts,
  public.commissions, public.search_console_daily
  from anon, authenticated;
