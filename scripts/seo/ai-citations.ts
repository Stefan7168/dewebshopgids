// Monthly AI citation check (launch scope, DECISIONS 2026-10-28). Asks Claude with web search
// each fixed prompt and records whether dewebshopgids.nl was found and cited. Runs on the 2nd of
// the month from ai-citations.yml as the `pipeline` role. Other assistants (ChatGPT, Perplexity)
// need their own API keys; not wired yet.
// Answers and other sites' URLs are untrusted data: only hosts and booleans are stored.
import Anthropic from "@anthropic-ai/sdk";
import { connect, runAgentJob, type Sql } from "../../agents/shared/audit";
import { CITATION_PROMPTS, type CitationPrompt } from "../../lib/seo/citation-prompts";
import { SITE } from "../../lib/site";

export const MODEL = "claude-sonnet-5-5";
const MAX_SEARCHES = 5;
const MAX_CONTINUES = 3;
// List prices (claude-api skill, shared/models.md): Sonnet 5.5 USD 2 / 10 per MTok, web search USD 10 per 1,000.
const USD_PER_IN = 2 / 1e6;
const USD_PER_OUT = 10 / 1e6;
const USD_PER_SEARCH = 10 / 1000;

export function costOf(u: Anthropic.Messages.Usage): number {
  const searches = u.server_tool_use?.web_search_requests ?? 0;
  const input = u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
  return input * USD_PER_IN + u.output_tokens * USD_PER_OUT + searches * USD_PER_SEARCH;
}

type Block = Anthropic.Messages.ContentBlock;
export type Outcome = { found: boolean; cited: boolean; our_urls: string[]; cited_domains: string[] };

function host(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}
const ours = (h: string | null) => h === SITE.domain || (h?.endsWith(`.${SITE.domain}`) ?? false);

/** Reads search results and answer citations from the response blocks. */
export function outcomeOf(blocks: Block[]): Outcome {
  const results: string[] = [];
  const citations: string[] = [];
  for (const b of blocks) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const r of b.content) results.push(r.url);
    if (b.type === "text") for (const c of b.citations ?? []) if (c.type === "web_search_result_location") citations.push(c.url);
  }
  const our = [...results, ...citations].filter((u) => ours(host(u)));
  return {
    found: results.some((u) => ours(host(u))),
    cited: citations.some((u) => ours(host(u))),
    our_urls: [...new Set(our)].slice(0, 10).map((u) => u.slice(0, 300)),
    cited_domains: [...new Set(citations.map(host).filter((h): h is string => h !== null && !ours(h)))].slice(0, 20),
  };
}

async function ask(client: Anthropic, prompt: string): Promise<{ blocks: Block[]; cost: number }> {
  const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: prompt }];
  const blocks: Block[] = [];
  let cost = 0;
  for (let i = 0; i <= MAX_CONTINUES; i++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES, user_location: { type: "approximate", country: "NL" } }],
      messages,
    });
    blocks.push(...res.content);
    cost += costOf(res.usage);
    if (res.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: res.content });
  }
  return { blocks, cost };
}

export async function runCitationCheck(sql: Sql, client: Anthropic, prompts: readonly CitationPrompt[] = CITATION_PROMPTS, today = new Date()) {
  const checkedOn = today.toISOString().slice(0, 10);
  let found = 0;
  let cited = 0;
  let cost = 0;
  const failed: string[] = [];
  for (const p of prompts) {
    let o: Outcome = { found: false, cited: false, our_urls: [], cited_domains: [] };
    let error: string | null = null;
    try {
      const r = await ask(client, p.prompt);
      cost += r.cost;
      o = outcomeOf(r.blocks);
    } catch (err) {
      error = String(err instanceof Error ? err.message : err).slice(0, 300);
      failed.push(p.id);
    }
    found += o.found ? 1 : 0;
    cited += o.cited ? 1 : 0;
    await sql`
      insert into public.ai_citation_checks (checked_on, provider, model, prompt_id, prompt, found, cited, our_urls, cited_domains, error)
      values (${checkedOn}, 'claude', ${MODEL}, ${p.id}, ${p.prompt}, ${o.found}, ${o.cited}, ${o.our_urls}, ${o.cited_domains}, ${error})
      on conflict (checked_on, provider, prompt_id) do update set found = excluded.found, cited = excluded.cited,
        our_urls = excluded.our_urls, cited_domains = excluded.cited_domains, error = excluded.error, model = excluded.model`;
  }
  await sql`
    update public.agent_settings set value = to_jsonb(round((value #>> '{}')::numeric + ${cost}, 4))
    where key = 'month_spend_usd'`;
  const summary = `claude: cited in ${cited} of ${prompts.length}, found in ${found}, cost USD ${cost.toFixed(2)}` + (failed.length ? `; failed: ${failed.join(", ")}` : "");
  if (failed.length > prompts.length / 2) throw new Error(summary);
  return { summary };
}

async function main() {
  const sql = connect();
  try {
    await runAgentJob(sql, { agent: "ai-citations", runsOn: "code", trigger: "schedule", spendsTokens: true }, async () => {
      const r = await runCitationCheck(sql, new Anthropic());
      console.log(r.summary);
      return r;
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("ai-citations.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
