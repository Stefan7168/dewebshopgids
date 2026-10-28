-- 0008: anon sees published and disputed shops, never draft, hidden or removed ones.
begin;

insert into public.shops (slug, name, domain, status) values
  ('t8-draft', 'Draft', 't8-draft.nl', 'draft'),
  ('t8-disputed', 'Disputed', 't8-disputed.nl', 'disputed'),
  ('t8-hidden', 'Hidden', 't8-hidden.nl', 'hidden'),
  ('t8-removed', 'Removed', 't8-removed.nl', 'removed');

set local role anon;
do $$
declare n int;
begin
  select count(*) into n from public.shops_public where slug like 't8-%';
  assert n = 1, format('anon must see only the disputed test shop, saw %s', n);
  select count(*) into n from public.shops_public where slug = 't8-disputed' and status = 'disputed';
  assert n = 1, 'shops_public must expose status = disputed';
  select count(*) into n from public.shops where slug like 't8-%';
  assert n = 1, 'anon table read must follow the same rule';
end $$;
reset role;

rollback;
