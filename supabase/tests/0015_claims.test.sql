-- 0015: claims and owner edits are internal; one pending edit per shop.
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

insert into public.shops (id, slug, name, domain) values ('00000000-0000-0000-0000-0000000000c1', 'cl-shop', 'CL', 'cl.example');
set local role service_role;
insert into public.shop_claims (id, shop_id, token_hash, expires_at)
  values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000c1', 'hash1', now() + interval '7 days');
insert into public.shop_edits (shop_id, claim_id, description_nl)
  values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2', 'Wij maken tafels van eikenhout in onze eigen werkplaats.');
reset role;

do $$
begin
  assert pg_temp.fails('anon', 'select count(*) from public.shop_claims'), 'anon must not read claims';
  assert pg_temp.fails('anon', 'select count(*) from public.shop_edits'), 'anon must not read edits';
  assert pg_temp.fails('authenticated', $q$insert into public.shop_claims (shop_id, token_hash, expires_at) values ('00000000-0000-0000-0000-0000000000c1', 'h2', now())$q$),
    'authenticated must not create claims';
  assert pg_temp.fails('pipeline', $q$update public.shop_edits set status = 'approved'$q$), 'pipeline must not approve edits';
  assert pg_temp.fails('agent_dispute', $q$update public.shop_edits set status = 'approved'$q$), 'agent_dispute must not approve edits';
  assert not pg_temp.fails('agent_dispute', 'select description_nl, status from public.shop_edits'), 'agent_dispute must read edits';
  assert pg_temp.fails('agent_dispute', 'select token_hash from public.shop_claims'), 'agent_dispute must not read tokens';
  assert pg_temp.fails('service_role', $q$insert into public.shop_edits (shop_id, claim_id, description_nl) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2', 'Nog een open voorstel voor dezelfde shop.')$q$),
    'only one pending edit per shop';
  assert pg_temp.fails('service_role', $q$insert into public.shop_edits (shop_id, claim_id, description_nl, status) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2', 'te kort', 'rejected')$q$),
    'description must be 20 to 600 characters';
end $$;

rollback;
