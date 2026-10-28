// A stand-in for the Anthropic Batch API in the end-to-end run. It "reads" each request the way
// the real model is asked to: it only quotes sentences that are on the pages, so quote
// verification, parsing and score maths run on realistic answers. Never used in production.
import { DATA_END, DATA_START } from "../../agents/shared/untrusted";
import type { BatchClient } from "../pipeline/score/batch";
import { SCORING_MODEL } from "../pipeline/score/prompt";

type Page = { id: string; type: string; text: string };

export function pagesFromRequest(userText: string): Page[] {
  const re = new RegExp(`Page (P\\d+) \\((\\w+)\\): \\S+\\n${escape(DATA_START)}\\n([\\s\\S]*?)\\n${escape(DATA_END)}`, "g");
  return [...userText.matchAll(re)].map((m) => ({ id: m[1], type: m[2], text: m[3] }));
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function find(pages: Page[], re: RegExp): { quote: string; page: string } | null {
  for (const p of pages) {
    for (const sentence of p.text.split(/(?<=[.!?])\s+|\n+/)) {
      if (re.test(sentence) && sentence.trim().length >= 12) return { quote: sentence.trim(), page: p.id };
    }
  }
  return null;
}

const yes = (hit: { quote: string; page: string } | null) => (hit ? { value: true, ...hit } : { value: false, quote: null, page: null });

/** The answer a careful model would give for these pages. */
export function answerFor(pages: Page[]) {
  const make = find(pages, /\b(maken|maak|gemaakt|atelier|werkplaats)\b/i);
  const many = find(pages, /\b(merken|duizenden|honderden)\b/i);
  const hand = find(pages, /met de hand|handgemaakt/i);
  const first = pages[0] ? find([pages[0]], /./) : null;
  return {
    own_production: yes(make),
    brand_owner: { value: false, quote: null, page: null },
    focus: many ? { value: "everything", ...many } : first ? { value: "single_niche", ...first } : { value: "broad", quote: null, page: null },
    has_named_owner: { value: false, quote: null, page: null },
    has_address: yes(find(pages, /\b\d{4}\s?[A-Z]{2}\b/)),
    origin_claims: hand ? [{ claim: "handmade", ...hand }] : [],
    marketplace_pattern: yes(many),
    dropship_indicators: { value: false, quote: null, page: null },
    price_level: 3,
    has_physical_store: false,
    store_city: null,
    ships_from_country: "NL",
    description_nl: make ? "Een webshop die de eigen producten zelf maakt." : "Een webshop met een breed aanbod.",
    // The real model is told to flag text that tries to instruct it (fixture makerij.test has one).
    instructions_in_data: pages.some((p) => /ignore (all )?previous instructions/i.test(p.text)),
  };
}

/** Records what was submitted; results() answers every request once the batch "ends". */
export function createFakeAnthropic() {
  const batches = new Map<string, { custom_id: string; text: string }[]>();
  let ended = false;
  const client: BatchClient = {
    messages: {
      batches: {
        create: (async (body: { requests: { custom_id: string; params: { messages: { content: string }[] } }[] }) => {
          const id = `msgbatch_e2e_${batches.size + 1}`;
          batches.set(id, body.requests.map((r) => ({ custom_id: r.custom_id, text: String(r.params.messages[0].content) })));
          return { id, processing_status: "in_progress" };
        }) as never,
        retrieve: (async (id: string) => ({ id, processing_status: ended ? "ended" : "in_progress" })) as never,
        results: (async (id: string) =>
          (async function* () {
            for (const r of batches.get(id) ?? []) {
              const text = JSON.stringify(answerFor(pagesFromRequest(r.text)));
              yield {
                custom_id: r.custom_id,
                result: {
                  type: "succeeded",
                  message: {
                    id: `msg_${r.custom_id}`, type: "message", role: "assistant", model: SCORING_MODEL, stop_reason: "end_turn",
                    content: [{ type: "text", text }],
                    usage: { input_tokens: 4000, output_tokens: 600, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
                  },
                },
              };
            }
          })()) as never,
      },
    },
  };
  return { client, endBatches: () => (ended = true), submitted: () => [...batches.values()].flat().length };
}
