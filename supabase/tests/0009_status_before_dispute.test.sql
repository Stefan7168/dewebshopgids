-- 0009: status_before_dispute holds only published or prenotified, and stays internal.
begin;

insert into public.shops (slug, name, domain, status, status_before_dispute)
  values ('t9-a', 'A', 't9-a.nl', 'disputed', 'prenotified');

do $$
begin
  begin
    insert into public.shops (slug, name, domain, status, status_before_dispute) values ('t9-b', 'B', 't9-b.nl', 'disputed', 'draft');
    raise exception 'status_before_dispute = draft must be rejected';
  exception when check_violation then null;
  end;
end $$;

set local role anon;
do $$
begin
  begin
    perform status_before_dispute from public.shops limit 1;
    raise exception 'anon must not read status_before_dispute';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role agent_dispute;
do $$
begin
  begin
    perform status_before_dispute from public.shops limit 1;
    raise exception 'agent_dispute must not read status_before_dispute';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

rollback;
