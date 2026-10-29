-- 0018: pin drafts are internal; the Analyst only drafts, the pipeline only posts approved pins.
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

set local role service_role;
insert into public.pin_drafts (id, target_path, title, description, board, status)
  values ('00000000-0000-0000-0000-0000000000f1', '/gids/2026-week-45', 'Gemaakt in Nederland', 'Vijf werkplaatsen die zelf maken wat ze verkopen.', 'wonen', 'approved'),
         ('00000000-0000-0000-0000-0000000000f2', '/beste/webshops-meubels', 'Unieke meubelwebshops', 'Nederlandse meubelwebshops, gerangschikt op echtheidsscore.', 'wonen', 'draft');
reset role;

do $$
declare n int;
begin
  assert pg_temp.fails('anon', 'select count(*) from public.pin_drafts'), 'anon must not read pin drafts';
  assert pg_temp.fails('authenticated', 'select count(*) from public.pin_drafts'), 'authenticated must not read pin drafts';
  assert not pg_temp.fails('agent_analyst', $q$insert into public.pin_drafts (target_path, title, description, board) values ('/webshop/houtatelier-noord', 'Houtatelier Noord', 'Meubels uit een eigen werkplaats in het noorden.', 'wonen')$q$),
    'analyst must draft a pin';
  assert pg_temp.fails('agent_analyst', $q$insert into public.pin_drafts (target_path, title, description, board, status) values ('/webshop/x', 'Titel hier', 'Een beschrijving van genoeg tekens lang.', 'wonen', 'approved')$q$),
    'analyst must not insert an approved pin';
  assert pg_temp.fails('agent_analyst', $q$update public.pin_drafts set status = 'approved'$q$), 'analyst must not approve';
  assert pg_temp.fails('agent_analyst', $q$insert into public.pin_drafts (target_path, title, description, board) values ('https://shop.example/', 'Titel hier', 'Een beschrijving van genoeg tekens lang.', 'wonen')$q$),
    'pins link only to our own pages';
  assert pg_temp.fails('pipeline', $q$update public.pin_drafts set status = 'posted' where id = '00000000-0000-0000-0000-0000000000f2'$q$) = false, 'statement runs';
  select count(*) into n from public.pin_drafts where id = '00000000-0000-0000-0000-0000000000f2' and status = 'draft';
  assert n = 1, 'pipeline must not post an unapproved draft';
  assert not pg_temp.fails('pipeline', $q$update public.pin_drafts set status = 'posted', posted_at = now(), pinterest_pin_id = '123' where id = '00000000-0000-0000-0000-0000000000f1'$q$),
    'pipeline posts an approved pin';
  assert pg_temp.fails('pipeline', $q$update public.pin_drafts set title = 'Andere titel'$q$), 'pipeline must not edit pin text';
end $$;

rollback;
