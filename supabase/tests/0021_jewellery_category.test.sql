-- 0021: Sieraden & accessoires is a top-level category with 3 sub-categories, readable by anon.
begin;

do $$
declare top uuid; subs int; n int;
begin
  select id into top from public.categories where slug = 'sieraden-accessoires' and parent_id is null;
  assert top is not null, 'sieraden-accessoires must be top-level';
  select count(*) into subs from public.categories where parent_id = top;
  assert subs = 3, format('expected 3 jewellery sub-categories, got %s', subs);
  set local role anon;
  select count(*) into n from public.categories where slug in ('sieraden-accessoires', 'sieraden', 'tassen-leer', 'sjaals-mutsen');
  reset role;
  assert n = 4, 'anon must read the new categories';
end $$;

rollback;
