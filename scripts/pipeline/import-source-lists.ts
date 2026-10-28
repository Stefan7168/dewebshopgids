// Weekly source list import (plan v3 section 8, step 1): Thuiswinkel.org B2C
// members into source_lists. Daisycon follows after approval (task 13 of section 8).
// Runs as the `pipeline` role. Only new member slugs get a certificate fetch,
// so after the first run a weekly run takes minutes.
//
// Usage: DATABASE_URL=<pipeline connection string> tsx scripts/pipeline/import-source-lists.ts
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { createPoliteFetcher } from "./fetch-polite";
import { certificateUrl, parseCertificatePage, parseMemberSearchPage, searchPageUrl } from "./sources/thuiswinkel";

const MAX_SEARCH_PAGES = 120;
const MAX_NEW_MEMBERS_PER_RUN = 500; // ~25 min at 3 s per request
const MAX_ERROR_RATE = 0.1;

type Polite = ReturnType<typeof createPoliteFetcher>;

export async function importThuiswinkel(sql: Sql, polite: Polite) {
  const known = new Set(
    (await sql<{ slug: string }[]>`
      select raw->>'slug' as slug from public.source_lists where source = 'thuiswinkel'`).map((r) => r.slug),
  );

  let requests = 0;
  let errors = 0;
  const newSlugs: string[] = [];
  for (let page = 1; page <= MAX_SEARCH_PAGES; page++) {
    requests++;
    const res = await polite.fetchPolite(searchPageUrl(page));
    if (res.kind !== "ok" || res.status !== 200) {
      if (res.kind === "robots_disallowed") throw new Error("thuiswinkel.org disallows our crawler in robots.txt");
      errors++;
      continue;
    }
    const parsed = parseMemberSearchPage(res.text);
    for (const slug of parsed.slugs) if (!known.has(slug) && !newSlugs.includes(slug)) newSlugs.push(slug);
    if (!parsed.hasNext || parsed.slugs.length === 0) break;
  }

  let imported = 0;
  let noWebsite = 0;
  for (const slug of newSlugs.slice(0, MAX_NEW_MEMBERS_PER_RUN)) {
    requests++;
    const res = await polite.fetchPolite(certificateUrl(slug));
    if (res.kind !== "ok" || res.status !== 200) {
      errors++;
      continue;
    }
    const { name, domain } = parseCertificatePage(res.text);
    if (!domain) {
      noWebsite++;
      continue;
    }
    await sql`
      insert into public.source_lists (source, domain, name, raw)
      values ('thuiswinkel', ${domain}, ${name}, ${sql.json({ slug, certificate_url: certificateUrl(slug) })})
      on conflict (source, domain) do update
        set name = excluded.name, raw = excluded.raw, imported_at = now()`;
    imported++;
  }

  const errorRate = requests ? errors / requests : 0;
  const summary = `thuiswinkel: ${newSlugs.length} new members found, ${imported} imported, ${noWebsite} without website, ${errors}/${requests} request errors`;
  if (errorRate > MAX_ERROR_RATE) throw new Error(`error rate ${(errorRate * 100).toFixed(1)}% over 10%: ${summary}`);
  return { summary, imported, errors, requests, remaining: Math.max(0, newSlugs.length - MAX_NEW_MEMBERS_PER_RUN) };
}

async function main() {
  const sql = connect();
  try {
    const status = await runAgentJob(
      sql,
      { agent: "source-import", runsOn: "code", trigger: process.env.GITHUB_EVENT_NAME ?? "manual", spendsTokens: false },
      async () => {
        const r = await importThuiswinkel(sql, createPoliteFetcher());
        console.log(r.summary);
        return { summary: r.summary };
      },
    );
    console.log(`run status: ${status}`);
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("import-source-lists.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
