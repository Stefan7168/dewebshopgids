-- 0021: fourth top-level category, Sieraden & accessoires (plan v3 phase 4 "next category";
-- chosen 2026-10-29 by the coordinator under Stefan's autonomy mandate, on the category research
-- thread's recommendation, see DECISIONS.md). Scope: jewellery, bags and other accessories made by
-- Dutch makers and ateliers (goldsmiths, silversmiths, leather workers, knitters). Purely additive.
-- Hidden from home page, header and llms.txt until 30 published shops (promotedRoots), like Tuin & buiten.
insert into public.categories (slug, name_nl, sort_order, intro_nl) values (
  'sieraden-accessoires', 'Sieraden & accessoires', 3,
  'Sieraden, tassen en andere accessoires van Nederlandse makers en ateliers: goudsmeden, zilversmeden, leerbewerkers en breiers.'
)
on conflict (slug) do nothing;

insert into public.categories (slug, name_nl, parent_id, sort_order)
select v.slug, v.name_nl, (select id from public.categories where slug = 'sieraden-accessoires'), v.sort_order
from (values
  ('sieraden', 'Sieraden', 1),
  ('tassen-leer', 'Tassen & leer', 2),
  ('sjaals-mutsen', 'Sjaals & mutsen', 3)
) as v (slug, name_nl, sort_order)
on conflict (slug) do nothing;
