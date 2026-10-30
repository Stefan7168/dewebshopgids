-- 0022: badge offers go only to owners who asked or interacted (coordinator decision 2026-10-30,
-- pending the lawyer: Telecommunicatiewet art. 11.7 makes cold commercial email opt-in by default).
-- "Interacted" = opened a claim link on their own domain (shop_claims.verified_at is set). The
-- Outreach tool filters on it, so it needs to read which shops have a verified claim: shop and
-- time only, never the token hash. Read only. Additive only.
grant select (shop_id, verified_at) on public.shop_claims to agent_outreach;
create policy shop_claims_outreach_read on public.shop_claims for select to agent_outreach
  using (verified_at is not null);
