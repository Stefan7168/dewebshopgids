-- 0026: only pipeline may purge, only a removed shop with a confirmed request, and only the minimal record stays.
begin;

create function pg_temp.fails(r text, stmt text) returns boolean language plpgsql as $$
begin
  execute format('set local role %I', r);
  begin
    execute stmt;
  exception when others then
    reset role;
    return true;
  end;
  reset role;
  return false;
end $$;

insert into public.shops (id, slug, name, domain, status, contact_email, description_nl, store_city, score) values
  ('00000000-0000-4000-8000-000000002601', 'rp-1', 'Atelier Jan', 'rp1.example', 'removed', 'info@rp1.example', 'Een beschrijving', 'Utrecht', 80),
  ('00000000-0000-4000-8000-000000002602', 'rp-2', 'RP2', 'rp2.example', 'removed', 'info@rp2.example', null, null, 70),
  ('00000000-0000-4000-8000-000000002603', 'rp-3', 'RP3', 'rp3.example', 'disputed', 'info@rp3.example', null, null, 75);
insert into public.disputes (shop_id, email, type, confirmed_at) values
  ('00000000-0000-4000-8000-000000002601', 'info@rp1.example', 'removal', now()),
  ('00000000-0000-4000-8000-000000002602', 'info@rp2.example', 'removal', null),
  ('00000000-0000-4000-8000-000000002603', 'info@rp3.example', 'objection', now());
insert into public.crawl_pages (shop_id, url, page_type, robots_allowed) values
  ('00000000-0000-4000-8000-000000002601', 'https://rp1.example/', 'home', true);
insert into public.scores (shop_id, score_version, total) values ('00000000-0000-4000-8000-000000002601', 'v2', 80);
insert into public.email_queue (shop_id, template) values ('00000000-0000-4000-8000-000000002601', 'prenotice');
update public.shops set stripe_subscription_id = 'sub_rp1', verified_badge_until = current_date + 20
  where id = '00000000-0000-4000-8000-000000002601';
insert into public.shop_candidates (domain, name, source, reason) values ('rp1.example', 'Atelier Jan', 'scout', 'Jan maakt alles zelf');

do $$
declare r jsonb; s record;
begin
  assert pg_temp.fails('anon', 'select public.purge_removed_shop(''00000000-0000-4000-8000-000000002601'')'), 'anon must not purge';
  assert pg_temp.fails('agent_dispute', 'select public.purge_removed_shop(''00000000-0000-4000-8000-000000002601'')'), 'agents must not purge';
  assert pg_temp.fails('pipeline', 'select public.purge_removed_shop(''00000000-0000-4000-8000-000000002602'')'), 'no purge without a confirmed request';
  assert pg_temp.fails('pipeline', 'select public.purge_removed_shop(''00000000-0000-4000-8000-000000002603'')'), 'no purge of a shop that is not removed';

  set local role pipeline;
  r := public.purge_removed_shop('00000000-0000-4000-8000-000000002601');
  reset role;
  assert (r->>'crawl_pages')::int = 1 and (r->>'scores')::int = 1 and (r->>'email_queue_unsent')::int = 1, 'counts: ' || r::text;

  select * into s from public.shops where id = '00000000-0000-4000-8000-000000002601';
  assert s.name = 'rp1.example' and s.contact_email is null and s.description_nl is null and s.store_city is null
    and s.score is null and s.purged_at is not null and s.slug = 'rp-1' and s.status = 'removed', 'only the minimal record stays';
  assert not exists (select 1 from public.crawl_pages where shop_id = '00000000-0000-4000-8000-000000002601'), 'crawl text deleted';
  assert exists (select 1 from public.disputes where shop_id = '00000000-0000-4000-8000-000000002601'), 'dispute kept as proof';
  assert (select name = 'rp1.example' and reason is null from public.shop_candidates where domain = 'rp1.example'), 'candidate row keeps only the domain';
  assert exists (select 1 from public.agent_escalations where kind = 'removed_shop_paid' and label = 'needs-human'
                 and title like '%rp1.example'), 'live badge escalated for a Stripe cancel';
  set local role pipeline;
  perform public.purge_removed_shop('00000000-0000-4000-8000-000000002601');
  reset role;
  assert (select count(*) from public.agent_escalations where kind = 'removed_shop_paid') = 1, 'a second purge files no second escalation';
  assert (select contact_email from public.shops where id = '00000000-0000-4000-8000-000000002602') is not null, 'unconfirmed shop untouched';
end $$;

rollback;
