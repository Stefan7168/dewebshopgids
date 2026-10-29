-- 0019: "Meest bezocht deze maand" (plan v3 section 10, a first-party data point on public pages).
-- The nightly pipeline counts outbound clicks of the last 30 days per published shop (bots left out)
-- and stores only a rank per shop. Raw clicks stay private; the public site reads ranks only.
create table public.shop_popularity (
  shop_id uuid primary key references public.shops (id) on delete cascade,
  rank integer not null check (rank between 1 and 100),
  computed_at timestamptz not null default now()
);

alter table public.shop_popularity enable row level security;
revoke all on public.shop_popularity from anon, authenticated;

-- Public read of the ranks; a rank row exists only for shops that were published when computed,
-- and the site joins it with shops_public, so a hidden shop never shows.
grant select on public.shop_popularity to anon, authenticated;
create policy shop_popularity_public_read on public.shop_popularity for select to anon, authenticated using (true);

-- The pipeline replaces the whole table each night.
grant select, insert, update, delete on public.shop_popularity to pipeline;
create policy shop_popularity_pipeline_all on public.shop_popularity for all to pipeline using (true) with check (true);
