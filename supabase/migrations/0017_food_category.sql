-- 0017: third top-level category, Eten & drinken (plan v3 phase 4 "next category";
-- chosen 2026-10-29 by the coordinator's research thread under Stefan's autonomy mandate, see DECISIONS.md).
-- Scope: food and non-alcoholic drinks from makers (roasters, chocolatiers, bakers, beekeepers, cheese makers).
-- Shops whose main product is alcohol stay out: online alcohol sales need age checks (Alcoholwet) and
-- alcohol ads follow the Reclamecode voor Alcoholhoudende Dranken. The rule is in intro_nl, which the
-- Shop Scout and Classifier read with the category. Purely additive.
-- Hidden from home page, header and llms.txt until 30 published shops (promotedRoots), like Tuin & buiten.
insert into public.categories (slug, name_nl, sort_order, intro_nl) values (
  'eten-drinken', 'Eten & drinken', 2,
  'Koffie, thee, chocolade, kaas en honing van Nederlandse makers en specialisten. Webshops die vooral alcohol verkopen nemen we niet op.'
)
on conflict (slug) do nothing;

insert into public.categories (slug, name_nl, parent_id, sort_order)
select v.slug, v.name_nl, (select id from public.categories where slug = 'eten-drinken'), v.sort_order
from (values
  ('koffie-thee', 'Koffie & thee', 1),
  ('chocolade-koek', 'Chocolade & koek', 2),
  ('kaas-delicatessen', 'Kaas & delicatessen', 3),
  ('honing', 'Honing', 4)
) as v (slug, name_nl, sort_order)
on conflict (slug) do nothing;
