-- 0012: Editor writes draft text only, Fact Checker writes the verdict only, anon sees published guides.
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

create function pg_temp.affected(r text, stmt text) returns integer language plpgsql as $$
declare n integer;
begin
  execute format('set local role %I', r);
  execute stmt;
  get diagnostics n = row_count;
  reset role;
  return n;
end $$;

set local role pipeline;
insert into public.guide_issues (id, iso_year, iso_week, slug, inputs_snapshot)
  values ('00000000-0000-0000-0000-0000000000a9', 2026, 46, '2026-week-46', '{"shops": []}');
reset role;

do $$
declare g constant text := '00000000-0000-0000-0000-0000000000a9';
begin
  assert pg_temp.affected('agent_guide', format($q$update public.guide_issues set title_nl = 'Vijf makers', body_md = 'Tekst' where id = %L$q$, g)) = 1,
    'agent_guide must write the draft';
  assert (select drafted_at is not null from public.guide_issues where id = g::uuid), 'drafted_at must be set by the trigger';
  assert pg_temp.fails('agent_guide', format($q$update public.guide_issues set status = 'fact_checked' where id = %L$q$, g)),
    'agent_guide must not set fact_checked';
  assert pg_temp.fails('agent_guide', format($q$update public.guide_issues set inputs_snapshot = '{}' where id = %L$q$, g)),
    'agent_guide must not change the inputs';
  assert pg_temp.fails('agent_factcheck', format($q$update public.guide_issues set body_md = 'x' where id = %L$q$, g)),
    'agent_factcheck must not edit body_md';
  assert pg_temp.fails('agent_factcheck', format($q$update public.guide_issues set status = 'approved' where id = %L$q$, g)),
    'agent_factcheck must not approve';
  assert pg_temp.affected('agent_factcheck', format($q$update public.guide_issues set status = 'fact_checked', fact_check_report = '{"ok": true}', checked_at = now() where id = %L$q$, g)) = 1,
    'agent_factcheck must set fact_checked';
  assert pg_temp.affected('agent_guide', format($q$update public.guide_issues set body_md = 'Na de check' where id = %L$q$, g)) = 0,
    'agent_guide must not change a checked issue';
  assert (select count(*) from public.guide_inputs) = 0, 'a checked issue leaves guide_inputs';
  assert pg_temp.fails('anon', 'select count(*) from public.guide_issues where inputs_snapshot is not null'), 'anon must not read inputs';
  assert pg_temp.affected('anon', 'select * from public.guides_public') = 0, 'anon must not see an unpublished guide';
  assert pg_temp.fails('agent_scout', 'select count(*) from public.guide_issues'), 'other agents must not read guides';
  assert pg_temp.fails('pipeline', $q$insert into public.guide_issues (iso_year, iso_week, slug, inputs_snapshot, shop_ids) values (2026, 47, '2026-week-47', '{}', array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()])$q$),
    'more than 5 shops must be rejected';
end $$;

update public.guide_issues set status = 'published', published_at = now();
do $$
begin
  assert pg_temp.affected('anon', 'select * from public.guides_public') = 1, 'anon must see a published guide';
end $$;

-- first_published_at is set once, on the first publication.
insert into public.shops (id, slug, name, domain, status) values ('00000000-0000-0000-0000-0000000000b9', 'fp', 'FP', 'fp.example', 'prenotified');
set local role pipeline;
update public.shops set status = 'published' where id = '00000000-0000-0000-0000-0000000000b9';
reset role;
do $$
begin
  assert (select first_published_at is not null from public.shops where id = '00000000-0000-0000-0000-0000000000b9'), 'first_published_at must be set';
end $$;

rollback;
