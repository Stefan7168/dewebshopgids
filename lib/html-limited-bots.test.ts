import { describe, expect, it } from "vitest";
import { HTML_LIMITED_BOTS } from "../next.config";

describe("HTML_LIMITED_BOTS", () => {
  it("gets metadata in <head> for AI crawlers and the Next.js defaults", () => {
    for (const ua of [
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "facebookexternalhit/1.1",
    ]) expect(HTML_LIMITED_BOTS.test(ua)).toBe(true);
  });

  it("streams for normal browsers", () => {
    expect(HTML_LIMITED_BOTS.test("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1")).toBe(false);
  });
});
