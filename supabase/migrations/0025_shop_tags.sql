-- 0025: hand-checked facts per shop domain for /beste list filters (coordinator decisions 2026-10-30:
-- "vintage interieur", "handgemaakt servies" and "koffiebranderijen" lists). A tag is set only after a person checked the shop's own site and kept a
-- quote (research/beste-topics-2026-10-30.md, research/handgemaakt-servies-2026-10-30.md, research/koffiebranderijen-2026-10-30.md); the crawl does not set tags. Keyed by domain, so a tag
-- can be added before the shop is promoted. Public read only for listed shops, domain and tag only.
create table public.shop_tags (
  domain text not null check (domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  tag text not null check (tag in ('vintage', 'handgemaakt-servies', 'eigen-branderij')),
  evidence text not null check (char_length(evidence) between 10 and 500),
  checked_on date not null,
  created_at timestamptz not null default now(),
  primary key (domain, tag)
);

alter table public.shop_tags enable row level security;
revoke all on public.shop_tags from anon, authenticated;

grant select (domain, tag) on public.shop_tags to anon, authenticated;
create policy shop_tags_public_read on public.shop_tags for select to anon, authenticated
  using (exists (select 1 from public.shops s where s.domain = shop_tags.domain and s.status in ('published', 'disputed')));

-- The pipeline may read them (nothing writes them except a hand-run paste as the owner).
grant select on public.shop_tags to pipeline;
create policy shop_tags_pipeline_read on public.shop_tags for select to pipeline using (true);
