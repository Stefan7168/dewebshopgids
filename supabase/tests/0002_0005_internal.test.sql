-- Every table from 0002 to 0005 is internal: RLS on, no anon or authenticated access.
begin;

do $$
declare
  t text;
  internal text[] := array[
    'crawl_pages', 'shop_signals',
    'score_runs', 'scores', 'score_checks', 'score_overrides',
    'shop_candidates', 'source_lists', 'disputes', 'agent_escalations', 'agent_schedule', 'health_checks',
    'subscribers', 'email_queue', 'outreach_drafts', 'commissions', 'search_console_daily'
  ];
begin
  foreach t in array internal loop
    assert exists (select 1 from pg_tables where schemaname = 'public' and tablename = t),
      format('table %s missing', t);
    assert (select relrowsecurity from pg_class where oid = format('public.%I', t)::regclass),
      format('RLS off on %s', t);
    assert not has_table_privilege('anon', format('public.%I', t), 'select,insert,update,delete'),
      format('anon has privileges on %s', t);
    assert not has_table_privilege('authenticated', format('public.%I', t), 'select,insert,update,delete'),
      format('authenticated has privileges on %s', t);
  end loop;
end $$;

-- Every table in public has RLS enabled (guards future migrations too).
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity loop
    raise exception 'RLS is off on public.%', r.relname;
  end loop;
end $$;

-- email_queue needs a recipient or a shop
do $$ begin
  begin
    insert into public.email_queue (template) values ('welcome');
    assert false, 'email_queue without to or shop_id must fail';
  exception when check_violation then null;
  end;
end $$;

rollback;
