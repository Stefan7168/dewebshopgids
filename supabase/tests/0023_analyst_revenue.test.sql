-- 0023: the Analyst reads badge end dates and placement end dates, never Stripe ids, and cannot write.
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

insert into public.shops (id, slug, name, domain, verified_badge_until, stripe_subscription_id) values
  ('00000000-0000-4000-8000-000000002301', 'ar-1', 'AR1', 'ar1.example', current_date + 10, 'sub_ar_1');
insert into public.featured_placements (shop_id, stripe_subscription_id, active_until) values
  ('00000000-0000-4000-8000-000000002301', 'sub_ar_2', current_date + 10);

do $$
declare n int;
begin
  assert not pg_temp.fails('agent_analyst', 'select verified_badge_until from public.shops'), 'analyst reads badge end dates';
  set local role agent_analyst;
  select count(*) into n from public.featured_placements where shop_id = '00000000-0000-4000-8000-000000002301' and active_until >= current_date;
  reset role;
  assert n = 1, 'analyst counts running placements';
  assert pg_temp.fails('agent_analyst', 'select stripe_subscription_id from public.shops'), 'analyst must not read Stripe ids on shops';
  assert pg_temp.fails('agent_analyst', 'select stripe_subscription_id from public.featured_placements'), 'analyst must not read Stripe ids on placements';
  assert pg_temp.fails('agent_analyst', 'update public.featured_placements set active_until = null'), 'analyst must not write placements';
  assert pg_temp.fails('agent_analyst', 'update public.shops set verified_badge_until = null'), 'analyst must not write shops';
end $$;

rollback;
