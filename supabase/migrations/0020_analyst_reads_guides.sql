-- 0020: the SEO/Growth Analyst offers published gids issues as Pinterest pin targets
-- (`analyst.ts pin-candidates`, migration 0018). It had no read access to guide_issues, so that
-- list was always empty. Read only, only published issues, only the columns it needs. Additive only.
grant select (slug, title_nl, status, iso_year, iso_week) on public.guide_issues to agent_analyst;
create policy guide_issues_analyst_read on public.guide_issues for select to agent_analyst
  using (status in ('published', 'sent', 'fallback'));
