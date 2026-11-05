-- 0023: the SEO/Growth Analyst's monthly forecast counts badge and Uitgelicht revenue (plan v4
-- north star: EUR 500 a month by week 52 from badge, commission and Uitgelicht together).
-- Read only: when a badge runs until, and which shops have a placement until when. Never the
-- Stripe subscription ids. Additive only. Comes after 0022 (PR #149).
grant select (verified_badge_until) on public.shops to agent_analyst;
grant select (shop_id, active_until) on public.featured_placements to agent_analyst;
create policy featured_placements_analyst_read on public.featured_placements
  for select to agent_analyst using (true);
