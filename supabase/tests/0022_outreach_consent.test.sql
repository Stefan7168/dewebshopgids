-- 0022: Outreach sees which shops have a verified claim, never the token or unverified claims, and cannot write.
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

insert into public.shops (id, slug, name, domain) values
  ('00000000-0000-4000-8000-000000002201', 'oc-1', 'OC1', 'oc1.example'),
  ('00000000-0000-4000-8000-000000002202', 'oc-2', 'OC2', 'oc2.example');
insert into public.shop_claims (shop_id, token_hash, expires_at, verified_at) values
  ('00000000-0000-4000-8000-000000002201', 'h-oc-1', now() + interval '7 days', now()),
  ('00000000-0000-4000-8000-000000002202', 'h-oc-2', now() + interval '7 days', null);

do $$
declare n int;
begin
  assert not pg_temp.fails('agent_outreach', 'select shop_id, verified_at from public.shop_claims'), 'outreach reads verified claims';
  set local role agent_outreach;
  select count(*) into n from public.shop_claims where shop_id in ('00000000-0000-4000-8000-000000002201', '00000000-0000-4000-8000-000000002202');
  reset role;
  assert n = 1, 'outreach must not see unverified claims';
  assert pg_temp.fails('agent_outreach', 'select token_hash from public.shop_claims'), 'outreach must not read token hashes';
  assert pg_temp.fails('agent_outreach', 'update public.shop_claims set verified_at = now()'), 'outreach must not write claims';
  assert pg_temp.fails('agent_scout', 'select shop_id from public.shop_claims'), 'other agents must not read claims';
end $$;

rollback;
