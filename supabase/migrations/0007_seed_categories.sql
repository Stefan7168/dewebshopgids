-- 0007 seed: launch category Wonen & interieur with provisional sub-categories.
-- Phase 2 replaces the sub-categories by product query volume (plan v3 section 5).
insert into public.categories (slug, name_nl, sort_order) values ('wonen', 'Wonen & interieur', 0)
on conflict (slug) do nothing;

insert into public.categories (slug, name_nl, parent_id, sort_order)
select v.slug, v.name_nl, (select id from public.categories where slug = 'wonen'), v.sort_order
from (values
  ('meubels', 'Meubels', 1),
  ('verlichting', 'Verlichting', 2),
  ('woonaccessoires', 'Woonaccessoires', 3),
  ('woontextiel', 'Woontextiel', 4),
  ('keuken-tafelen', 'Keuken & tafelen', 5),
  ('slapen', 'Slapen', 6),
  ('tuin-buiten', 'Tuin & buiten', 7)
) as v (slug, name_nl, sort_order)
on conflict (slug) do nothing;
