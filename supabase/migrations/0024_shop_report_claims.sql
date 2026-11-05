-- 0024: the free monthly shop report (plan v4 section 12, "Launch+, free shop report") goes only to
-- shops whose owner used a claim link on their own domain, the same consent rule as badge offers in
-- 0022 (Telecommunicatiewet art. 11.7, pending the lawyer). The report job runs as `pipeline`, which
-- so far cannot read shop_claims. Shop and time only, never the token hash. Read only. Additive only.
grant select (shop_id, verified_at) on public.shop_claims to pipeline;
create policy shop_claims_pipeline_read on public.shop_claims for select to pipeline
  using (verified_at is not null);
