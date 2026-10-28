import { describe, expect, it } from "vitest";
import { aiSource } from "./ai-referrer";

const page = "https://dewebshopgids.nl/webshop/x";

describe("aiSource", () => {
  it("maps known AI hosts and utm tags to fixed labels", () => {
    expect(aiSource("https://chatgpt.com/", page)).toBe("chatgpt");
    expect(aiSource("https://www.perplexity.ai/search?q=x", page)).toBe("perplexity");
    expect(aiSource("https://gemini.google.com/app", page)).toBe("gemini");
    expect(aiSource("", `${page}?utm_source=chatgpt.com`)).toBe("chatgpt");
  });

  it("ignores everything else", () => {
    expect(aiSource("https://www.google.com/", page)).toBeNull();
    expect(aiSource("https://chatgpt.com.evil.test/", page)).toBeNull();
    expect(aiSource("not a url", "also not")).toBeNull();
    expect(aiSource("", `${page}?utm_source=nieuwsbrief`)).toBeNull();
  });
});
