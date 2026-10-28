-- 0010: monthly AI citation check (launch scope, DECISIONS 2026-10-28). One row per fixed
-- prompt per provider per month: did the assistant's web search find dewebshopgids.nl, and did
-- the answer cite it. Written by code (pipeline role), read by the SEO/Growth Analyst.
-- Additive only. Internal table, no anon access.

create table public.ai_citation_checks (
  id uuid primary key default gen_random_uuid(),
  checked_on date not null,
  provider text not null check (provider in ('claude')),
  model text not null,
  prompt_id text not null check (prompt_id ~ '^[a-z0-9-]{1,60}$'),
  prompt text not null check (char_length(prompt) <= 500),
  found boolean not null,  -- our domain appeared in the search results
  cited boolean not null,  -- the answer cited a page on our domain
  our_urls text[] not null default '{}',
  -- Untrusted data: domains of other cited sites, for comparison only.
  cited_domains text[] not null default '{}',
  error text,
  created_at timestamptz not null default now(),
  unique (checked_on, provider, prompt_id)
);

alter table public.ai_citation_checks enable row level security;
revoke all on public.ai_citation_checks from anon, authenticated;

grant select, insert, update on public.ai_citation_checks to pipeline;
create policy ai_citation_checks_pipeline_all on public.ai_citation_checks for all to pipeline using (true) with check (true);

grant select on public.ai_citation_checks to agent_analyst;
create policy ai_citation_checks_analyst_read on public.ai_citation_checks for select to agent_analyst using (true);
