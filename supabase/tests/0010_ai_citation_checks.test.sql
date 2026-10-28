-- 0010: pipeline writes citation checks, the Analyst only reads them, anon sees nothing.
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

set local role pipeline;
insert into public.ai_citation_checks (checked_on, provider, model, prompt_id, prompt, found, cited)
  values ('2026-11-01', 'claude', 'm', 'meubels-uniek', 'Waar koop ik unieke meubels?', true, false);
reset role;

do $$
begin
  assert pg_temp.fails('agent_analyst', $q$insert into public.ai_citation_checks (checked_on, provider, model, prompt_id, prompt, found, cited) values ('2026-11-01', 'claude', 'm', 'x', 'x', false, false)$q$),
    'agent_analyst must not insert';
  assert not pg_temp.fails('agent_analyst', 'select count(*) from public.ai_citation_checks'), 'agent_analyst must read';
  assert pg_temp.fails('anon', 'select count(*) from public.ai_citation_checks'), 'anon must not read';
  assert pg_temp.fails('agent_scout', 'select count(*) from public.ai_citation_checks'), 'agent_scout must not read';
  assert pg_temp.fails('pipeline', $q$insert into public.ai_citation_checks (checked_on, provider, model, prompt_id, prompt, found, cited) values ('2026-11-01', 'chatgpt', 'm', 'y', 'y', false, false)$q$),
    'unknown provider must be rejected';
end $$;

rollback;
