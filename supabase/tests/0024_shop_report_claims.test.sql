-- 0024: pipeline sees which shops have a verified claim, never tokens, and cannot write claims.
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
  ('00000000-0000-4000-8000-000000002401', 'sr-1', 'SR1', 'sr1.example'),
  ('00000000-0000-4000-8000-000000002402', 'sr-2', 'SR2', 'sr2.example');
insert into public.shop_claims (shop_id, token_hash, expires_at, verified_at) values
  ('00000000-0000-4000-8000-000000002401', 'sr-hash-1', now() + interval '1 day', now()),
  ('00000000-0000-4000-8000-000000002402', 'sr-hash-2', now() + interval '1 day', null);

do $$
declare n int;
begin
  set local role pipeline;
  select count(*) into n from public.shop_claims where shop_id in ('00000000-0000-4000-8000-000000002401', '00000000-0000-4000-8000-000000002402');
  reset role;
  assert n = 1, 'pipeline sees only verified claims';
  assert pg_temp.fails('pipeline', 'select token_hash from public.shop_claims'), 'pipeline must not read claim tokens';
  assert pg_temp.fails('pipeline', 'update public.shop_claims set verified_at = now()'), 'pipeline must not write claims';
  assert pg_temp.fails('pipeline', 'insert into public.shop_claims (shop_id, token_hash, expires_at) values (''00000000-0000-4000-8000-000000002402'', ''x'', now())'), 'pipeline must not create claims';
end $$;

rollback;
