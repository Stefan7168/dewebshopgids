-- 0019: anyone reads popularity ranks; only the pipeline writes them.
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

insert into public.shops (id, slug, name, domain) values ('00000000-0000-0000-0000-0000000000a9', 'pop-shop', 'Pop', 'pop.example');

do $$
begin
  assert not pg_temp.fails('pipeline', $q$insert into public.shop_popularity (shop_id, rank) values ('00000000-0000-0000-0000-0000000000a9', 1)$q$), 'pipeline writes ranks';
  assert not pg_temp.fails('anon', 'select shop_id, rank from public.shop_popularity'), 'anon reads ranks';
  assert pg_temp.fails('anon', $q$update public.shop_popularity set rank = 2$q$), 'anon must not write ranks';
  assert pg_temp.fails('authenticated', $q$delete from public.shop_popularity$q$), 'authenticated must not write ranks';
  assert pg_temp.fails('agent_analyst', $q$insert into public.shop_popularity (shop_id, rank) values ('00000000-0000-0000-0000-0000000000a9', 3)$q$), 'agents must not write ranks';
  assert pg_temp.fails('anon', 'select count(*) from public.clicks'), 'raw clicks stay private';
  assert pg_temp.fails('pipeline', $q$update public.shop_popularity set rank = 0$q$), 'rank must be 1 to 100';
end $$;

rollback;
