-- 0008: a disputed shop stays visible with "In beoordeling" instead of disappearing
-- (plan v3 section 7, step 9: the score reads "In beoordeling"). Anyone can file a dispute,
-- so removing the page at once would let a competitor take any shop offline with one form.
-- The page code hides the score, sub-scores and quotes for status `disputed`.

drop policy shops_public_read_published on public.shops;
create policy shops_public_read_listed on public.shops
  for select to anon, authenticated using (status in ('published', 'disputed'));

-- New column appended at the end, as `create or replace view` requires.
create or replace view public.shops_public with (security_invoker = true) as
  select
    id, slug, name, domain, category_id, platform, product_count_est, domain_first_seen,
    keurmerk, keurmerk_status, affiliate_available, price_level, has_physical_store,
    store_city, ships_from_country, score, score_version, score_label,
    description_nl, verified_badge_until, updated_at, status
  from public.shops
  where status in ('published', 'disputed');
