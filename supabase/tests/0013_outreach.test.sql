-- 0013: opt-out and Stripe link stay internal; the Outreach agent sees only the opt-out.
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

insert into public.shops (id, slug, name, domain, stripe_subscription_id)
  values ('00000000-0000-0000-0000-0000000013a1', 'or-shop', 'OR', 'or.example', 'sub_1');

do $$
begin
  assert not pg_temp.fails('agent_outreach', 'select outreach_opt_out_at from public.shops'), 'agent_outreach must read the opt-out';
  assert pg_temp.fails('agent_outreach', 'select stripe_subscription_id from public.shops'), 'agent_outreach must not read Stripe ids';
  assert pg_temp.fails('agent_outreach', 'update public.shops set outreach_opt_out_at = null'), 'agent_outreach must not clear an opt-out';
  assert pg_temp.fails('anon', 'select outreach_opt_out_at from public.shops'), 'anon must not read the opt-out';
  assert pg_temp.fails('anon', 'select stripe_subscription_id from public.shops'), 'anon must not read Stripe ids';
  assert pg_temp.fails('agent_scout', 'select stripe_subscription_id from public.shops'), 'other agents must not read Stripe ids';
  assert pg_temp.fails('service_role',
    $q$insert into public.shops (slug, name, domain, stripe_subscription_id) values ('or-2', 'OR2', 'or2.example', 'sub_1')$q$),
    'one subscription belongs to one shop';
end $$;

rollback;
