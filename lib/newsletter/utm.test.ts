import { describe, expect, it } from "vitest";
import { aiReferralUtm, parseUtm, sourceWithUtm } from "./utm";

describe("parseUtm", () => {
  it("keeps only the three tags, lowercased", () => {
    expect(parseUtm("?utm_source=Meta&utm_medium=paid&utm_campaign=launch nov&fbclid=abc&email=x@y.nl")).toEqual({
      utm_source: "meta",
      utm_medium: "paid",
      utm_campaign: "launch-nov",
    });
  });
  it("reads a stored object and drops values that are not tags", () => {
    expect(parseUtm({ utm_source: "pinterest", utm_medium: "<script>", utm_campaign: 5 })).toEqual({ utm_source: "pinterest" });
    expect(parseUtm("?q=hout")).toBeNull();
    expect(parseUtm(null)).toBeNull();
  });
});

describe("sourceWithUtm", () => {
  it("appends the tags to the page path", () => {
    expect(sourceWithUtm("/top-25", { utm_source: "meta", utm_campaign: "launch" })).toBe("/top-25?utm_source=meta&utm_campaign=launch");
    expect(sourceWithUtm("/", null)).toBe("/");
  });
});

describe("parseUtm on AI links", () => {
  it("tags utm_source=chatgpt.com, which ChatGPT adds to its links, as an AI visit", () => {
    expect(parseUtm("?utm_source=chatgpt.com")).toEqual({ utm_source: "chatgpt", utm_medium: "ai-referral" });
    expect(parseUtm("?utm_source=perplexity.ai&utm_campaign=x")).toEqual({ utm_source: "perplexity", utm_medium: "ai-referral", utm_campaign: "x" });
    expect(parseUtm("?utm_source=chatgpt.com&utm_medium=cpc")).toEqual({ utm_source: "chatgpt.com", utm_medium: "cpc" });
    expect(parseUtm({ utm_source: "chatgpt", utm_medium: "ai-referral" })).toEqual({ utm_source: "chatgpt", utm_medium: "ai-referral" });
  });
});

describe("aiReferralUtm", () => {
  it("tags visits from AI assistants by name only", () => {
    expect(aiReferralUtm("https://chatgpt.com/c/abc-123")).toEqual({ utm_source: "chatgpt", utm_medium: "ai-referral" });
    expect(aiReferralUtm("https://www.perplexity.ai/search?q=x")).toEqual({ utm_source: "perplexity", utm_medium: "ai-referral" });
    expect(aiReferralUtm("https://gemini.google.com/app")?.utm_source).toBe("gemini");
    expect(aiReferralUtm("https://claude.ai/chat/1")?.utm_source).toBe("claude");
  });
  it("ignores other and broken referrers", () => {
    expect(aiReferralUtm("https://www.google.com/")).toBeNull();
    expect(aiReferralUtm("https://notchatgpt.com.evil.nl/")).toBeNull();
    expect(aiReferralUtm("not a url")).toBeNull();
    expect(aiReferralUtm("")).toBeNull();
  });
});
