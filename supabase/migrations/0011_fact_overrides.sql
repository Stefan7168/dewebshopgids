-- 0011: manual corrections that win over the pipeline (DECISIONS 2026-10-28).
-- A person approves a fact correction in /admin (service role). The nightly
-- `apply-overrides` step (pipeline role) writes it to shops and keeps writing it
-- after every crawl or rescoring, until someone revokes it.
-- Score corrections keep using score_overrides; this adds the `revoked` state there.
-- Additive only. Internal table, no anon access.

create table public.fact_overrides (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  fact text not null check (fact in ('online', 'assortiment', 'keurmerk', 'prijsniveau', 'winkel', 'verzending', 'beschrijving')),
  -- Typed per fact by lib/overrides/facts.ts, for example {"year": 2015} or {"count": 40}.
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  reason text not null check (char_length(reason) between 1 and 2000),
  dispute_id uuid references public.disputes (id) on delete set null,
  status text not null default 'approved' check (status in ('approved', 'applied', 'revoked')),
  approved_by text not null,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
-- One active correction per fact per shop; a new one first revokes the old one.
create unique index fact_overrides_one_active on public.fact_overrides (shop_id, fact)
  where status in ('approved', 'applied');

alter table public.fact_overrides enable row level security;
revoke all on public.fact_overrides from anon, authenticated;

grant select on public.fact_overrides to pipeline;
grant update (status, applied_at) on public.fact_overrides to pipeline;
create policy fact_overrides_pipeline_read on public.fact_overrides for select to pipeline using (true);
create policy fact_overrides_pipeline_apply on public.fact_overrides for update to pipeline
  using (status in ('approved', 'applied')) with check (status in ('approved', 'applied'));

grant select on public.fact_overrides to agent_dispute;
create policy fact_overrides_dispute_read on public.fact_overrides for select to agent_dispute using (true);

alter table public.score_overrides drop constraint score_overrides_status_check;
alter table public.score_overrides add constraint score_overrides_status_check
  check (status in ('draft', 'approved', 'rejected', 'applied', 'applied_by_default', 'revoked'));
