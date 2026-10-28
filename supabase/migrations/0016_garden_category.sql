-- 0016: second top-level category, Tuin & buiten (plan v3 phase 4 "second category";
-- chosen 2026-10-28 by the coordinator under Stefan's autonomy mandate, see DECISIONS.md).
-- The existing sub-category 'tuin-buiten' becomes the top level, so its slug, URLs, shops and
-- candidates stay valid. New sub-categories go under it. Additive apart from the re-parenting,
-- which `update ... set parent_id = (wonen)` undoes.

update public.categories
set parent_id = null, sort_order = 1, name_nl = 'Tuin & buiten'
where slug = 'tuin-buiten';

insert into public.categories (slug, name_nl, parent_id, sort_order)
select v.slug, v.name_nl, (select id from public.categories where slug = 'tuin-buiten'), v.sort_order
from (values
  ('tuinmeubels', 'Tuinmeubels', 1),
  ('potten-plantenbakken', 'Potten & plantenbakken', 2),
  ('buitenverlichting', 'Buitenverlichting', 3),
  ('vuur-bbq', 'Vuur & bbq', 4),
  ('tuinaccessoires', 'Tuinaccessoires', 5)
) as v (slug, name_nl, sort_order)
on conflict (slug) do nothing;
