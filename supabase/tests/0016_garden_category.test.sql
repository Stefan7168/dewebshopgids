-- 0016: Tuin & buiten is a top-level category with its own sub-categories, readable by anon.
begin;

do $$
declare top uuid; subs int; n int;
begin
  select id into top from public.categories where slug = 'tuin-buiten' and parent_id is null;
  assert top is not null, 'tuin-buiten must be top-level';
  select count(*) into subs from public.categories where parent_id = top;
  assert subs = 5, format('expected 5 garden sub-categories, got %s', subs);
  select count(*) into n from public.categories where parent_id = (select id from public.categories where slug = 'wonen');
  assert n = 6, format('wonen keeps 6 sub-categories, got %s', n);
  set local role anon;
  select count(*) into n from public.categories where slug in ('tuinmeubels', 'vuur-bbq');
  reset role;
  assert n = 2, 'anon must read the new categories';
end $$;

rollback;
