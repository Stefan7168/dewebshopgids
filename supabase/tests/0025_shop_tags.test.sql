-- 0025: anon sees tags only for listed shops and never the evidence; nobody but the owner writes tags.
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

insert into public.shops (id, slug, name, domain, status) values
  ('00000000-0000-4000-8000-000000002501', 'st-1', 'ST1', 'st1.example', 'draft');
insert into public.shop_tags (domain, tag, evidence, checked_on) values
  ('st1.example', 'vintage', 'restored mid-century furniture', current_date),
  ('st2.example', 'vintage', 'vintage lamps and brocante', current_date);

do $$
declare n int;
begin
  set local role anon;
  select count(*) into n from public.shop_tags;
  reset role;
  assert n = 0, 'anon sees no tags of unlisted shops';
  assert pg_temp.fails('anon', 'select evidence from public.shop_tags'), 'anon must not read evidence';
  assert pg_temp.fails('anon', 'insert into public.shop_tags (domain, tag, evidence, checked_on) values (''x.example'', ''vintage'', ''0123456789'', current_date)'), 'anon must not write tags';
  assert pg_temp.fails('pipeline', 'insert into public.shop_tags (domain, tag, evidence, checked_on) values (''x.example'', ''vintage'', ''0123456789'', current_date)'), 'pipeline must not write tags';
  assert pg_temp.fails('agent_scout', 'select domain from public.shop_tags'), 'agents do not read tags';
end $$;

-- Publishing the shop makes its tag visible (status set by the owner here, standing in for the publish job).
alter table public.shops disable trigger shops_guard_publish;
update public.shops set status = 'published' where id = '00000000-0000-4000-8000-000000002501';
alter table public.shops enable trigger shops_guard_publish;

do $$
declare n int;
begin
  set local role anon;
  select count(*) into n from public.shop_tags;
  reset role;
  assert n = 1, 'anon sees the tag of a listed shop only';
end $$;

rollback;
