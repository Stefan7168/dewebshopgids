import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { CITATION_PROMPTS } from "../../lib/seo/citation-prompts";
import { outcomeOf } from "./ai-citations";

type Block = Anthropic.Messages.ContentBlock;
const result = (url: string) => ({ type: "web_search_result", url, title: "t", encrypted_content: "", page_age: null });
const searchBlock = (urls: string[]) => ({ type: "web_search_tool_result", tool_use_id: "x", content: urls.map(result) }) as unknown as Block;
const text = (urls: string[]) =>
  ({ type: "text", text: "a", citations: urls.map((url) => ({ type: "web_search_result_location", url, title: null, cited_text: "", encrypted_index: "" })) }) as unknown as Block;

describe("outcomeOf", () => {
  it("separates found from cited", () => {
    const o = outcomeOf([searchBlock(["https://www.dewebshopgids.nl/beste/webshops-meubels", "https://shop.nl/x"]), text(["https://shop.nl/x", "https://andere.nl/"])]);
    expect(o).toEqual({ found: true, cited: false, our_urls: ["https://www.dewebshopgids.nl/beste/webshops-meubels"], cited_domains: ["shop.nl", "andere.nl"] });
  });
  it("counts a citation of our page", () => expect(outcomeOf([text(["https://dewebshopgids.nl/webshop/a"])]).cited).toBe(true));
  it("does not count look-alike domains", () => expect(outcomeOf([searchBlock(["https://nietdewebshopgids.nl/"])]).found).toBe(false));
  it("survives a search error block", () =>
    expect(outcomeOf([{ type: "web_search_tool_result", tool_use_id: "x", content: { type: "web_search_tool_result_error", error_code: "unavailable" } } as unknown as Block]).found).toBe(false));
});

describe("CITATION_PROMPTS", () => {
  it("has 20 unique ids that fit the table", () => {
    expect(CITATION_PROMPTS).toHaveLength(20);
    expect(new Set(CITATION_PROMPTS.map((p) => p.id)).size).toBe(20);
    for (const p of CITATION_PROMPTS) {
      expect(p.id).toMatch(/^[a-z0-9-]{1,60}$/);
      expect(p.prompt.length).toBeLessThanOrEqual(500);
    }
  });
});

describe("costOf", () => {
  it("adds tokens and searches at list price", async () => {
    const { costOf } = await import("./ai-citations");
    const u = { input_tokens: 100_000, output_tokens: 1_000, server_tool_use: { web_search_requests: 3 } } as unknown as Anthropic.Messages.Usage;
    expect(costOf(u)).toBeCloseTo(0.2 + 0.01 + 0.03, 6);
  });
});
