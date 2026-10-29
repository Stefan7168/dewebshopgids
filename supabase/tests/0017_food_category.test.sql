-- 0017: Eten & drinken is a top-level category with 4 sub-categories, readable by anon; other roots unchanged.
begin;

do $$
declare top uuid; subs int; n int;
begin
  select id into top from public.categories where slug = 'eten-drinken' and parent_id is null;
  assert top is not null, 'eten-drinken must be top-level';
  select count(*) into subs from public.categories where parent_id = top;
  assert subs = 4, format('expected 4 food sub-categories, got %s', subs);
  select count(*) into n from public.categories where parent_id is null;
  assert n = 3, format('expected 3 top-level categories, got %s', n);
  select count(*) into n from public.categories where slug = 'eten-drinken' and intro_nl like '%alcohol%';
  assert n = 1, 'the intro must state the alcohol rule';
  set local role anon;
  select count(*) into n from public.categories where slug in ('eten-drinken', 'koffie-thee', 'honing');
  reset role;
  assert n = 3, 'anon must read the new categories';
end $$;

rollback;
