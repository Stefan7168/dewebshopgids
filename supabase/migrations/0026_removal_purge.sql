-- 0026: after a confirmed removal or objection, delete what we hold about the shop and keep only what the
-- 410 page and "never list again" need: id, slug, domain, status (AVG art. 17; lawyer brief 2026-10-30,
-- question 8). The name becomes the domain, because an eenmanszaak's name can name a person.
-- Kept on purpose: disputes (proof that we handled the request), commissions and featured_placements
-- (bookkeeping), clicks (no personal data). One narrow function instead of broad delete grants: it refuses
-- any shop that is not removed with a confirmed request, and only `pipeline` may call it.
-- The candidate row keeps only the domain (so the Scout never suggests it again). A live badge or Uitgelicht
-- subscription is not cancelled here: it gets a needs-human escalation so a person cancels it in Stripe.
alter table public.shops add column purged_at timestamptz;

create function public.purge_removed_shop(p_shop_id uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s record;
  n int;
  out jsonb := '{}'::jsonb;
begin
  select id, slug, domain, status, purged_at into s from public.shops where id = p_shop_id for update;
  if not found or s.status <> 'removed' then
    raise exception 'shop % is not removed', p_shop_id;
  end if;
  if not exists (select 1 from public.disputes d where d.shop_id = p_shop_id
                 and d.type in ('removal', 'objection') and d.confirmed_at is not null) then
    raise exception 'shop % has no confirmed removal or objection', p_shop_id;
  end if;

  delete from public.crawl_pages where shop_id = p_shop_id;     get diagnostics n = row_count; out := out || jsonb_build_object('crawl_pages', n);
  delete from public.shop_signals where shop_id = p_shop_id;    get diagnostics n = row_count; out := out || jsonb_build_object('shop_signals', n);
  delete from public.score_checks where shop_id = p_shop_id;    get diagnostics n = row_count; out := out || jsonb_build_object('score_checks', n);
  delete from public.score_overrides where shop_id = p_shop_id; get diagnostics n = row_count; out := out || jsonb_build_object('score_overrides', n);
  delete from public.scores where shop_id = p_shop_id;          get diagnostics n = row_count; out := out || jsonb_build_object('scores', n);
  delete from public.fact_overrides where shop_id = p_shop_id;  get diagnostics n = row_count; out := out || jsonb_build_object('fact_overrides', n);
  delete from public.shop_edits where shop_id = p_shop_id;      get diagnostics n = row_count; out := out || jsonb_build_object('shop_edits', n);
  delete from public.shop_claims where shop_id = p_shop_id;     get diagnostics n = row_count; out := out || jsonb_build_object('shop_claims', n);
  delete from public.outreach_drafts where shop_id = p_shop_id; get diagnostics n = row_count; out := out || jsonb_build_object('outreach_drafts', n);
  delete from public.shop_popularity where shop_id = p_shop_id; get diagnostics n = row_count; out := out || jsonb_build_object('shop_popularity', n);
  delete from public.email_queue where shop_id = p_shop_id and sent_at is null;
  get diagnostics n = row_count; out := out || jsonb_build_object('email_queue_unsent', n);
  delete from public.pin_drafts where target_path = '/webshop/' || s.slug and status <> 'posted';
  get diagnostics n = row_count; out := out || jsonb_build_object('pin_drafts', n);
  if to_regclass('public.shop_tags') is not null then -- 0025, may not be applied yet
    execute 'delete from public.shop_tags where domain = $1' using s.domain;
    get diagnostics n = row_count; out := out || jsonb_build_object('shop_tags', n);
  end if;

  update public.shop_candidates set name = s.domain, reason = null where domain = s.domain;
  get diagnostics n = row_count; out := out || jsonb_build_object('shop_candidates', n);

  if s.purged_at is null and (exists (select 1 from public.shops where id = p_shop_id and stripe_subscription_id is not null
             and verified_badge_until >= current_date)
     or exists (select 1 from public.featured_placements where shop_id = p_shop_id and active_until >= current_date)) then
    insert into public.agent_escalations (agent, kind, title, body_md, label)
    values ('dispute-removals', 'removed_shop_paid', 'Removed shop still pays: cancel in Stripe: ' || s.domain,
            'Shop `' || s.domain || '` was removed at the owner''s request but still has a live badge or Uitgelicht '
            || 'subscription. Cancel it in the Stripe dashboard (Customers, search the domain). Whether to refund is your call.',
            'needs-human');
    out := out || jsonb_build_object('escalated_subscription', true);
  end if;

  update public.shops set
    name = s.domain, description_nl = null, contact_email = null, contact_email_source = null,
    store_city = null, has_physical_store = null, ships_from_country = null, platform = null,
    product_count_est = null, product_count_method = null, domain_first_seen = null, domain_age_sources = '{}'::jsonb,
    keurmerk = '{}', keurmerk_status = 'none', keurmerk_verified_method = null, price_level = null,
    score = null, score_version = null, score_label = null,
    affiliate_available = false, affiliate_network = null, affiliate_url = null,
    purged_at = now()
  where id = p_shop_id;
  return out;
end $$;

revoke all on function public.purge_removed_shop(uuid) from public, anon, authenticated;
grant execute on function public.purge_removed_shop(uuid) to pipeline;
