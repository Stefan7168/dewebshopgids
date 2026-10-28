-- 0011: only a person (service role) approves corrections; the pipeline applies them.
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

insert into public.shops (id, slug, name, domain) values ('00000000-0000-0000-0000-0000000000f1', 'fo-shop', 'FO', 'fo.example');
set local role service_role;
insert into public.fact_overrides (id, shop_id, fact, value, reason, approved_by)
  values ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', 'online', '{"year": 2015}', 'KvK uittreksel', 'stefan@example.com');
reset role;

do $$
begin
  assert not pg_temp.fails('pipeline', $q$update public.fact_overrides set status = 'applied', applied_at = now() where id = '00000000-0000-0000-0000-0000000000f2'$q$),
    'pipeline must mark a correction applied';
  assert pg_temp.fails('pipeline', $q$update public.fact_overrides set status = 'revoked' where id = '00000000-0000-0000-0000-0000000000f2'$q$),
    'pipeline must not revoke';
  assert pg_temp.fails('pipeline', $q$update public.fact_overrides set value = '{"year": 1999}' where id = '00000000-0000-0000-0000-0000000000f2'$q$),
    'pipeline must not change the value';
  assert pg_temp.fails('pipeline', $q$insert into public.fact_overrides (shop_id, fact, value, reason, approved_by) values ('00000000-0000-0000-0000-0000000000f1', 'keurmerk', '{}', 'x', 'pipeline')$q$),
    'pipeline must not approve corrections';
  assert pg_temp.fails('agent_dispute', $q$insert into public.fact_overrides (shop_id, fact, value, reason, approved_by) values ('00000000-0000-0000-0000-0000000000f1', 'keurmerk', '{}', 'x', 'agent')$q$),
    'agent_dispute must not approve corrections';
  assert not pg_temp.fails('agent_dispute', 'select count(*) from public.fact_overrides'), 'agent_dispute must read';
  assert pg_temp.fails('anon', 'select count(*) from public.fact_overrides'), 'anon must not read';
  assert pg_temp.fails('service_role', $q$insert into public.fact_overrides (shop_id, fact, value, reason, approved_by) values ('00000000-0000-0000-0000-0000000000f1', 'online', '{"year": 2010}', 'x', 's')$q$),
    'a second active correction for the same fact must be rejected';
  assert pg_temp.fails('service_role', $q$insert into public.fact_overrides (shop_id, fact, value, reason, approved_by) values ('00000000-0000-0000-0000-0000000000f1', 'score', '{}', 'x', 's')$q$),
    'score corrections go through score_overrides';
end $$;

-- score_overrides accepts the new revoked state.
insert into public.score_overrides (shop_id, proposed_by, new_total, reason, status)
  values ('00000000-0000-0000-0000-0000000000f1', 'human', 50, 'x', 'revoked');

rollback;
