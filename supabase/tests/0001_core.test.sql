-- Tests for 0001_core. Runs in a transaction and rolls back.
begin;

insert into public.categories (slug, name_nl) values ('wonen', 'Wonen');
insert into public.shops (slug, name, domain, category_id, status, contact_email)
values
  ('draft-shop', 'Draft', 'draft.nl', (select id from public.categories where slug = 'wonen'), 'draft', 'info@draft.nl'),
  ('pub-shop', 'Pub', 'pub.nl', (select id from public.categories where slug = 'wonen'), 'published', 'info@pub.nl');

-- agents_enabled defaults to true
do $$ begin
  assert (select value from public.agent_settings where key = 'agents_enabled') = 'true'::jsonb,
    'agents_enabled should default to true';
end $$;

set local role anon;

do $$
declare n int;
begin
  -- anon sees zero draft rows through the view
  select count(*) into n from public.shops_public where slug = 'draft-shop';
  assert n = 0, 'anon must not see draft shops in shops_public';
  select count(*) into n from public.shops_public;
  assert n = 1, 'anon must see exactly the published shop';

  -- anon sees zero draft rows on the table
  select count(*) into n from public.shops;
  assert n = 1, 'anon must see only published rows on shops';

  -- anon cannot read contact_email
  begin
    perform contact_email from public.shops;
    assert false, 'anon must not read shops.contact_email';
  exception when insufficient_privilege then null;
  end;

  -- anon cannot write shops
  begin
    insert into public.shops (slug, name, domain) values ('x', 'x', 'x.nl');
    assert false, 'anon must not insert shops';
  exception when insufficient_privilege then null;
  end;

  -- anon cannot touch internal tables
  begin
    perform 1 from public.agent_settings;
    assert false, 'anon must not read agent_settings';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.clicks;
    assert false, 'anon must not read clicks';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.agent_runs;
    assert false, 'anon must not read agent_runs';
  exception when insufficient_privilege then null;
  end;

  -- categories are public
  select count(*) into n from public.categories;
  assert n = 1, 'anon must read categories';
end $$;

reset role;
rollback;
