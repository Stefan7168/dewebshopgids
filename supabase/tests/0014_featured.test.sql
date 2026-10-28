-- 0014: only the service role writes placements; anon sees live ones without the Stripe id.
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

insert into public.shops (id, slug, name, domain) values ('00000000-0000-0000-0000-0000000000e1', 'fe-shop', 'FE', 'fe.example');
set local role service_role;
insert into public.featured_placements (shop_id, stripe_subscription_id, active_until) values
  ('00000000-0000-0000-0000-0000000000e1', 'sub_live', current_date + 10),
  ('00000000-0000-0000-0000-0000000000e1', 'sub_old', current_date - 1);
reset role;

do $$
declare n int;
begin
  set local role anon;
  select count(*) into n from public.featured_public;
  reset role;
  assert n = 1, 'anon must see only the live placement';
  assert pg_temp.fails('anon', 'select stripe_subscription_id from public.featured_placements'), 'anon must not read the Stripe id';
  assert pg_temp.fails('anon', $q$insert into public.featured_placements (shop_id, stripe_subscription_id) values ('00000000-0000-0000-0000-0000000000e1', 'x')$q$),
    'anon must not write';
  assert pg_temp.fails('pipeline', $q$update public.featured_placements set active_until = current_date + 400$q$), 'pipeline must not extend';
  assert pg_temp.fails('agent_outreach', $q$insert into public.featured_placements (shop_id, stripe_subscription_id) values ('00000000-0000-0000-0000-0000000000e1', 'y')$q$),
    'agent_outreach must not write';
  assert not pg_temp.fails('agent_outreach', 'select shop_id, active_until from public.featured_placements'), 'agent_outreach must read';
  assert pg_temp.fails('service_role', $q$insert into public.featured_placements (shop_id, stripe_subscription_id) values ('00000000-0000-0000-0000-0000000000e1', 'sub_live')$q$),
    'one row per subscription';
end $$;

rollback;
