-- 0001 core: categories, shops, clicks, agent_runs, agent_settings, shops_public.
-- Plan v3 section 7. RLS on every table; anon reads published shops only,
-- through shops_public (security_invoker) and a column-limited grant.

-- updated_at helper -----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- categories ------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_nl text not null,
  parent_id uuid references public.categories (id) on delete restrict,
  intro_nl text,
  seo_title text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_id_idx on public.categories (parent_id);
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- shops -----------------------------------------------------------------------
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  domain text not null unique check (domain = lower(domain) and domain !~ '^https?://' and domain !~ '/'),
  category_id uuid references public.categories (id) on delete restrict,
  platform text check (platform in ('shopify', 'woocommerce', 'lightspeed', 'magento', 'shopware', 'ccvshop', 'other')),
  product_count_est integer check (product_count_est >= 0),
  product_count_method text check (product_count_method in ('sitemap', 'collection_pages', 'platform_api', 'manual')),
  domain_first_seen date,
  domain_age_sources jsonb not null default '{}'::jsonb,
  keurmerk text[] not null default '{}'
    check (keurmerk <@ array['thuiswinkel', 'webwinkelkeur', 'trusted_shops', 'other']::text[]),
  keurmerk_status text not null default 'none' check (keurmerk_status in ('none', 'unverified', 'verified')),
  keurmerk_verified_method text,
  affiliate_available boolean not null default false,
  price_level smallint check (price_level between 1 and 4),
  has_physical_store boolean,
  store_city text,
  ships_from_country text check (ships_from_country ~ '^[A-Z]{2}$'),
  -- Internal only, never public: a role address (info@, contact@) on the shop's own domain.
  contact_email text check (contact_email is null or contact_email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  contact_email_source text check (contact_email_source in ('contact_page', 'prenotice_reply', 'manual')),
  score smallint check (score between 1 and 100),
  score_version text,
  score_label text,
  status text not null default 'draft'
    check (status in ('draft', 'prenotified', 'published', 'hidden', 'disputed', 'removed')),
  description_nl text,
  affiliate_network text,
  affiliate_url text check (affiliate_url is null or affiliate_url ~ '^https://'),
  verified_badge_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shops_category_id_idx on public.shops (category_id);
create index shops_status_score_idx on public.shops (status, score desc);
create trigger shops_set_updated_at before update on public.shops
  for each row execute function public.set_updated_at();

-- clicks (no IP, no user-agent hash) ---------------------------------------------
create table public.clicks (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  referer_path text,
  source text,
  device text check (device in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  country text check (country ~ '^[A-Z]{2}$')
);
create index clicks_shop_id_occurred_at_idx on public.clicks (shop_id, occurred_at desc);

-- agent_runs ------------------------------------------------------------------
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  runs_on text not null check (runs_on in ('routine', 'action', 'code')),
  trigger text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'ok', 'failed', 'paused', 'over_budget')),
  input_ref text,
  output_refs jsonb not null default '[]'::jsonb,
  tokens_in integer check (tokens_in >= 0),
  tokens_out integer check (tokens_out >= 0),
  cost_usd_est numeric(10, 4) check (cost_usd_est >= 0),
  summary text,
  error text
);
create index agent_runs_agent_started_at_idx on public.agent_runs (agent, started_at desc);

-- agent_settings --------------------------------------------------------------
create table public.agent_settings (
  key text primary key,
  value jsonb not null,
  updated_by text not null default current_user,
  updated_at timestamptz not null default now()
);
create trigger agent_settings_set_updated_at before update on public.agent_settings
  for each row execute function public.set_updated_at();

insert into public.agent_settings (key, value, updated_by) values
  ('agents_enabled', 'true'::jsonb, 'migration'),
  ('monthly_budget_usd', '150'::jsonb, 'migration'),
  ('month_spend_usd', '0'::jsonb, 'migration'),
  ('gates', '{"G1": true, "G2": true, "G3": true, "G4": true, "G5": true, "G6": true}'::jsonb, 'migration');

-- RLS and grants --------------------------------------------------------------
-- Supabase grants anon and authenticated full table privileges by default.
-- Revoke everything, then grant back only what the public site needs.
alter table public.categories enable row level security;
alter table public.shops enable row level security;
alter table public.clicks enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_settings enable row level security;

revoke all on public.categories, public.shops, public.clicks, public.agent_runs, public.agent_settings
  from anon, authenticated;

-- Categories are public navigation data.
grant select on public.categories to anon, authenticated;
create policy categories_public_read on public.categories
  for select to anon, authenticated using (true);

-- Shops: published rows only, public columns only (no contact_email, affiliate_url, status internals).
grant select (
  id, slug, name, domain, category_id, platform, product_count_est, domain_first_seen,
  keurmerk, keurmerk_status, affiliate_available, price_level, has_physical_store,
  store_city, ships_from_country, score, score_version, score_label, status,
  description_nl, verified_badge_until, updated_at
) on public.shops to anon, authenticated;
create policy shops_public_read_published on public.shops
  for select to anon, authenticated using (status = 'published');

create view public.shops_public with (security_invoker = true) as
  select
    id, slug, name, domain, category_id, platform, product_count_est, domain_first_seen,
    keurmerk, keurmerk_status, affiliate_available, price_level, has_physical_store,
    store_city, ships_from_country, score, score_version, score_label,
    description_nl, verified_badge_until, updated_at
  from public.shops
  where status = 'published';

revoke all on public.shops_public from anon, authenticated;
grant select on public.shops_public to anon, authenticated;

-- clicks, agent_runs, agent_settings: no anon or authenticated access at all.
-- Writes come from server code (service role) and, from migration 0006, per-agent login roles.
