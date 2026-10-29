-- 0020: the Analyst reads published gids issues only, never drafts, bodies or the right to write.
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

insert into public.guide_issues (slug, iso_year, iso_week, status, inputs_snapshot) values
  ('2099-week-01', 2099, 1, 'published', '{}'), ('2099-week-02', 2099, 2, 'draft', '{}');

do $$
declare n int;
begin
  assert not pg_temp.fails('agent_analyst', $q$select slug, title_nl from public.guide_issues where status in ('published', 'sent') order by iso_year desc, iso_week desc limit 4$q$), 'analyst reads published issues';
  set local role agent_analyst;
  select count(*) into n from public.guide_issues where slug like '2099-%';
  reset role;
  assert n = 1, 'analyst must not see drafts';
  assert pg_temp.fails('agent_analyst', 'select body_md from public.guide_issues'), 'analyst must not read bodies';
  assert pg_temp.fails('agent_analyst', $q$update public.guide_issues set title_nl = 'x'$q$), 'analyst must not write issues';
end $$;

rollback;
