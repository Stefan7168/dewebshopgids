-- 0014: paid "Uitgelicht" placements (plan v3 sections 10 and 12, week 22+).
-- EUR 49 per month through a fixed Stripe Payment Link. The Stripe webhook (service role)
-- writes rows; code shows at most two per sub-category, only for shops scoring 70+, as a
-- separate block labelled "Advertentie" and never inside a ranked list.
-- Additive only.

create table public.featured_placements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  stripe_subscription_id text not null unique,
  -- Paid period end plus grace; null once the subscription ends.
  active_until date,
  created_at timestamptz not null default now()
);
create index featured_placements_shop on public.featured_placements (shop_id);

alter table public.featured_placements enable row level security;
revoke all on public.featured_placements from anon, authenticated;

-- Public read: live placements only, and never the Stripe subscription id.
grant select (shop_id, active_until) on public.featured_placements to anon, authenticated;
create policy featured_placements_public_read on public.featured_placements
  for select to anon, authenticated using (active_until >= current_date);

create view public.featured_public with (security_invoker = true) as
  select shop_id, active_until from public.featured_placements where active_until >= current_date;
revoke all on public.featured_public from anon, authenticated;
grant select on public.featured_public to anon, authenticated;

-- The Outreach agent sees who already pays, so it does not offer Uitgelicht twice.
grant select (shop_id, active_until) on public.featured_placements to agent_outreach;
create policy featured_placements_outreach_read on public.featured_placements
  for select to agent_outreach using (true);
