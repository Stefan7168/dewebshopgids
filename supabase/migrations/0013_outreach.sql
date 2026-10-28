-- 0013 outreach and the "Geverifieerd" badge (plan v3 sections 3, 10 and 13).
-- outreach_opt_out_at: a shop that asked for no more sales email is never drafted or mailed again
--   (B2B email needs a working opt-out; set by Stefan in /admin/outreach).
-- stripe_subscription_id: links a paid badge to its Stripe subscription, so renewals and
--   cancellations from /api/stripe/webhook find the shop. Written only by the service role.
-- Neither column is granted to anon: the public site reads shops through a column-limited grant.
alter table public.shops
  add column outreach_opt_out_at timestamptz,
  add column stripe_subscription_id text unique;

-- The Outreach agent must see the opt-out to skip those shops.
grant select (outreach_opt_out_at) on public.shops to agent_outreach;

