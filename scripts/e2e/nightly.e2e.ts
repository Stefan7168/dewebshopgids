// End-to-end run (started by scripts/e2e/run.sh): three nights of the real nightly steps, the
// email queue and the weekly gids, on a fresh database, against fixture websites
// (scripts/pipeline/fixtures) and a fake Anthropic client. Every step runs as the `pipeline`
// role, as in production; setup and checks use the admin connection.
import assert from "node:assert/strict";
import postgres from "postgres";
import { connect } from "../../agents/shared/audit";
import { prepareIssue } from "../guide/prepare";
import { runGuidePublish } from "../guide/publish";
import { sendQueue, type SendEmail } from "../email/send-queue";
import { createPoliteFetcher } from "../pipeline/fetch-polite";
import { nightlySteps, runSteps } from "../pipeline/nightly";
import { createFixtureFetch } from "../pipeline/test-utils/fixture-fetch";
import { readFileSync } from "node:fs";
import { createFakeAnthropic } from "./fake-anthropic";

const SHOPS = [
  { domain: "houtatelier.test", name: "Houtatelier", category: "meubels" },
  { domain: "makerij.test", name: "De Makerij", category: "meubels" },
  { domain: "lampenhuis.test", name: "Lampenhuis", category: "verlichting" },
  { domain: "stoerwonen.test", name: "Stoer Wonen", category: "meubels" },
];
const WHOIS = readFileSync(new URL("../pipeline/fixtures/extract/sidn-whois.txt", import.meta.url), "utf8");

const admin = postgres({ database: process.env.E2E_DB, max: 1, onnotice: () => {} });
const sql = connect(process.env.E2E_PIPELINE_URL);
const fake = createFakeAnthropic();
const fixtures = createFixtureFetch();
const sent: { template: string; to: string; subject: string }[] = [];
const sendEmail: SendEmail = async (m) => {
  sent.push({ template: m.idempotencyKey, to: m.to, subject: m.subject });
};

function deps() {
  return {
    client: fake.client,
    fetchPolite: createPoliteFetcher({ fetchImpl: fixtures.fetchImpl, sleep: async () => {}, minIntervalMs: 0 }).fetchPolite,
    domainAge: { whois: async () => WHOIS, firstCapture: async () => new Date("2011-05-01"), sleep: async () => {} },
    env: {}, // no Search Console key: the step skips
  };
}

async function night(n: number) {
  const results = await runSteps(sql, nightlySteps(sql, deps()));
  const runs = await admin<{ agent: string; status: string; summary: string | null }[]>`
    select agent, status, summary from public.agent_runs where trigger = 'pipeline' order by started_at desc limit ${results.length}`;
  console.log(`\nnight ${n}`);
  for (const r of runs.reverse()) console.log(`  ${r.agent.padEnd(18)} ${r.status.padEnd(6)} ${r.summary ?? ""}`);
  const bad = results.filter((r) => r.status !== "ok");
  assert.deepEqual(bad, [], `night ${n}: steps not ok`);
}

async function main() {
  // Setup: four accepted candidates (Stefan's G6 decision) and pre-notices switched on.
  for (const s of SHOPS) {
    await admin`
      insert into public.shop_candidates (domain, name, source, status, decided_by, suggested_category_id)
      values (${s.domain}, ${s.name}, 'e2e', 'accepted', 'e2e', (select id from public.categories where slug = ${s.category}))`;
  }
  await admin`insert into public.agent_settings (key, value, updated_by) values ('prenotice_enabled', 'true'::jsonb, 'e2e')
              on conflict (key) do update set value = 'true'::jsonb`;

  // Night 1: candidates become draft shops, are crawled and aged, and one batch is submitted.
  await night(1);
  const drafts = await admin<{ domain: string; status: string; product_count_est: number | null; age_sources: string; contact_email: string | null }[]>`
    select domain, status, product_count_est, domain_age_sources::text as age_sources, contact_email from public.shops order by domain`;
  console.table(drafts);
  assert.equal(drafts.length, SHOPS.length, "every accepted candidate becomes a shop");
  assert.ok(drafts.every((s) => s.status === "draft"), "new shops start as draft");
  // Non-.nl domains have no WHOIS source, so the age is stored but not shown (two sources must agree).
  assert.ok(drafts.every((s) => s.age_sources !== "{}"), "domain age sources are stored");
  const [{ pages }] = await admin<{ pages: number }[]>`select count(*)::int as pages from public.crawl_pages`;
  assert.ok(pages >= SHOPS.length, "crawl stored pages");
  // stoerwonen.test answers robots.txt with 503: we keep out (counted as a crawl error), so it is not scored.
  assert.equal(fake.submitted(), SHOPS.length - 1, "one batch with every shop that has page text");

  // Night 2: the batch has ended; scores are written and pre-notices queued.
  fake.endBatches();
  await night(2);
  const scored = await admin<{ domain: string; status: string; score: number | null; score_label: string | null; verified: number; band: string | null }[]>`
    select s.domain, s.status, s.score, s.score_label,
      (select count(*)::int from public.shop_signals g where g.shop_id = s.id and g.source = 'llm' and g.quote_verified) as verified,
      (select sc.sub_scores ->> 'band' from public.scores sc where sc.shop_id = s.id order by created_at desc limit 1) as band
    from public.shops s order by domain`;
  console.table(scored);
  assert.equal(scored.filter((s) => s.band).length, SHOPS.length - 1, "every submitted shop has a score row");
  const maker = scored.find((s) => s.domain === "houtatelier.test")!;
  const big = scored.find((s) => s.domain === "lampenhuis.test")!;
  assert.ok(maker.verified > 0, "maker quotes verified on the page");
  if (maker.score != null && big.score != null) assert.ok(maker.score > big.score, "a maker scores above a big lamp shop");
  const [collect] = await admin<{ summary: string }[]>`
    select summary from public.agent_runs where agent = 'score-collect' order by started_at desc limit 1`;
  assert.match(collect.summary, /instructions found in shop data/, "the injection on makerij.test is reported in agent_runs.summary");

  // Email: the queue sends pre-notices to the shops' role addresses.
  console.log("\nsend-queue:", (await sendQueue(sql, sendEmail, "owner@e2e.test")).summary);
  console.table(sent);
  const prenotified = await admin<{ domain: string }[]>`select domain from public.shops where status = 'prenotified'`;
  assert.ok(prenotified.length > 0, "at least one shop is pre-noticed");
  assert.ok(sent.length >= prenotified.length, "every pre-notice was sent");

  // Seven days later: night 3 publishes the pre-noticed shops.
  await admin`update public.email_queue set sent_at = sent_at - interval '8 days' where template = 'prenotice'`;
  await night(3);
  const visible = await admin.begin(async (tx) => {
    await tx`set local role anon`;
    return tx<{ slug: string; score: number | null }[]>`select slug, score from public.shops_public order by score desc nulls last`;
  });
  console.log("\nshops_public as anon:", visible);
  assert.equal(visible.length, prenotified.length, "pre-noticed shops are public after 7 days");

  // Weekly gids: prepare from tonight's green run, the Editor's draft and approval, then publish.
  // The gids of next week covers shops published this week: move the clock to next Monday 06:00
  // and date tonight's green nightly to that morning.
  const monday = nextMonday0600Amsterdam(new Date());
  await admin`update public.health_checks set checked_at = ${new Date(monday.getTime() - 5 * 3_600_000)}
              where id = (select id from public.health_checks where "check" = 'failed_runs' order by checked_at desc limit 1)`;
  const prep = await prepareIssue(sql, monday);
  console.log("\nprepare:", prep.summary);
  assert.doesNotMatch(prep.summary, /0 shop\(s\)/, "this week's new shops are in the gids inputs");
  const now = new Date(monday.getTime() + 2 * 86_400_000 + 4 * 3_600_000); // Wednesday 10:00
  const [issue] = await admin<{ id: string; slug: string; inputs_snapshot: { shops: { id: string; slug: string; name: string }[] } }[]>`
    select id, slug, inputs_snapshot from public.guide_issues`;
  assert.ok(issue, "prepare created this week's issue");
  const pick = issue.inputs_snapshot.shops[0];
  await admin`
    update public.guide_issues set title_nl = 'Nieuw deze week', intro_nl = 'Een maker uit Zwolle.',
      body_md = ${pick ? `## [${pick.name}](/webshop/${pick.slug})\n\nNieuw in de gids.` : "Deze week geen nieuwe webshops."},
      shop_ids = ${pick ? [pick.id] : []}, status = 'approved', approved_by = 'e2e' where id = ${issue.id}`;
  const broadcasts: string[] = [];
  const pub = await runGuidePublish(sql, "send", now, async (b) => {
    broadcasts.push(b.subject);
    return "bc_e2e";
  });
  console.log("gids publish:", pub.summary);
  const [g] = await admin<{ status: string }[]>`select status from public.guide_issues where id = ${issue.id}`;
  assert.equal(g.status, "sent", "the approved gids is published and sent");
  assert.equal(broadcasts.length, 1, "one broadcast");

  const [{ failed }] = await admin<{ failed: number }[]>`select count(*)::int as failed from public.agent_runs where status <> 'ok'`;
  assert.equal(failed, 0, "no failed agent_runs rows");
  console.log("\nend-to-end run passed");
}

function nextMonday0600Amsterdam(from: Date): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  d.setUTCHours(5, 0, 0, 0); // 06:00 CET; the prepare step only needs the Amsterdam date
  return d;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
    await admin.end();
  });
