-- 0015: shop claiming, v1 (plan v3 section 12, "claiming"). A shop proves it controls an
-- address on its own domain (link in an email, the same proof as removal requests) and may
-- then propose its own description. Proposals land as drafts; a person approves them in
-- /admin, which writes a 'beschrijving' fact_override so the nightly pipeline keeps the text.
-- No personal data: the address the link went to is not stored, only a hash of the token.
-- Additive only. Internal tables, no anon access; server code uses the service role.

create table public.shop_claims (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index shop_claims_shop on public.shop_claims (shop_id, created_at desc);

create table public.shop_edits (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  claim_id uuid not null references public.shop_claims (id) on delete cascade,
  description_nl text not null check (char_length(description_nl) between 20 and 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- Reason shown to nobody outside /admin; never a quote of personal data.
  review_note text check (char_length(review_note) <= 500),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
-- One open proposal per shop: a new one replaces the old draft in code.
create unique index shop_edits_one_pending on public.shop_edits (shop_id) where status = 'pending';

alter table public.shop_claims enable row level security;
alter table public.shop_edits enable row level security;
revoke all on public.shop_claims, public.shop_edits from anon, authenticated;

-- The Dispute Handler may read proposals to pre-check them (plan v3: claiming moderated by it).
grant select (id, shop_id, description_nl, status, created_at) on public.shop_edits to agent_dispute;
create policy shop_edits_dispute_read on public.shop_edits for select to agent_dispute using (true);
