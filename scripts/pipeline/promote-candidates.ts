// Seed import (plan v3 section 15, task 10): accepted shop_candidates become
// draft shops with unique slugs. Runs as the `pipeline` role, nightly before the
// crawl. Checks domain, category and duplicates; duplicates are marked as such.
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { shopSlugBase, uniqueSlug } from "../../lib/slug";
import { normalizeDomain } from "./domain";

type Accepted = { id: string; domain: string; name: string | null; suggested_category_id: string | null };

export async function promoteCandidates(sql: Sql) {
  const rows = await sql<Accepted[]>`
    select c.id, c.domain, c.name, c.suggested_category_id
    from public.shop_candidates c
    where c.status = 'accepted'
      and not exists (select 1 from public.shops s where s.domain = c.domain)
    order by c.created_at`;
  const taken = new Set((await sql<{ slug: string }[]>`select slug from public.shops`).map((r) => r.slug));
  const categoryIds = new Set((await sql<{ id: string }[]>`select id from public.categories`).map((r) => r.id));

  let created = 0;
  let duplicates = 0;
  let invalid = 0;
  for (const c of rows) {
    const domain = normalizeDomain(c.domain);
    if (!domain || domain !== c.domain) {
      invalid++;
      await sql`update public.shop_candidates set status = 'rejected', reason = coalesce(reason, '') || ' [pipeline: invalid domain]' where id = ${c.id}`;
      continue;
    }
    const [dup] = await sql`select 1 from public.shops where domain = ${domain} or domain = ${`www.${domain}`}`;
    if (dup) {
      duplicates++;
      await sql`update public.shop_candidates set status = 'duplicate' where id = ${c.id}`;
      continue;
    }
    const slug = uniqueSlug(shopSlugBase(c.name, domain), taken);
    taken.add(slug);
    const categoryId = c.suggested_category_id && categoryIds.has(c.suggested_category_id) ? c.suggested_category_id : null;
    await sql`
      insert into public.shops (slug, name, domain, category_id, status)
      values (${slug}, ${c.name ?? domain}, ${domain}, ${categoryId}, 'draft')`;
    created++;
  }
  return { created, duplicates, invalid, summary: `promoted ${created}, duplicates ${duplicates}, invalid ${invalid}` };
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "promote-candidates", runsOn: "code", spendsTokens: false }, async () => {
      const r = await promoteCandidates(sql);
      console.log(r.summary);
      return { summary: r.summary };
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("promote-candidates.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
