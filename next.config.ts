import type { NextConfig } from "next";

// Crawlers that read only the first HTML and run no JavaScript. Next.js streams metadata
// (title, description, canonical) into the body for other user agents; these get it in
// <head>. Setting this replaces the Next.js default list, so that list is copied here
// (next/dist/shared/lib/router/utils/html-bots.js, Next 16.4) and the AI crawlers are added.
// AI crawlers: https://platform.openai.com/docs/bots, https://support.claude.com/en/articles/8896518,
// https://docs.perplexity.ai/guides/bots
const NEXT_DEFAULT_BOTS =
  "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";
const AI_BOTS =
  "GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|CCBot|Amazonbot|meta-externalagent|DuckAssistBot|MistralAI-User|cohere-ai|Bytespider";
export const HTML_LIMITED_BOTS = new RegExp(`${NEXT_DEFAULT_BOTS}|${AI_BOTS}`, "i");

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Pages for slugs unknown at build serve the shell, then cache the URL-specific render (ISR).
  partialPrefetching: true,
  htmlLimitedBots: HTML_LIMITED_BOTS,
};

export default nextConfig;
