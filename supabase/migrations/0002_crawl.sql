-- 0002 crawl: crawl_pages, shop_signals (plan v3 section 7). Internal tables, no anon access.

create table public.crawl_pages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  url text not null check (url ~ '^https?://'),
  page_type text not null
    check (page_type in ('home', 'about', 'product', 'collection', 'contact', 'sitemap', 'robots', 'keurmerk_certificate', 'other')),
  fetched_at timestamptz not null default now(),
  status_code smallint,
  robots_allowed boolean not null,
  content_hash text,
  -- Untrusted data. Deleted after 90 days (pipeline job).
  text_excerpt text check (char_length(text_excerpt) <= 20000),
  unique (shop_id, url)
);
create index crawl_pages_fetched_at_idx on public.crawl_pages (fetched_at);

-- Append only: one row per signal per run. Never update or delete in normal operation.
create table public.shop_signals (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  run_id uuid,
  signal_key text not null check (signal_key ~ '^[a-z][a-z0-9_]*$'),
  value_numeric numeric,
  value_bool boolean,
  evidence_quote text,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https?://'),
  quote_verified boolean not null default false,
  match_ratio numeric(4, 3) check (match_ratio between 0 and 1),
  source text not null check (source in ('rule', 'llm', 'registry', 'auditor', 'human')),
  created_at timestamptz not null default now()
);
create index shop_signals_shop_key_idx on public.shop_signals (shop_id, signal_key, created_at desc);
create index shop_signals_run_id_idx on public.shop_signals (run_id);

alter table public.crawl_pages enable row level security;
alter table public.shop_signals enable row level security;
revoke all on public.crawl_pages, public.shop_signals from anon, authenticated;
