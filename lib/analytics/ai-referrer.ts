// AI-referrer segment (AI data-source assessment, action 3): which AI assistant sent a visitor.
// Referrers are untrusted data: we only map a parsed host to a fixed label, never store the URL.
const AI_HOSTS: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "gemini.google.com": "gemini",
  "copilot.microsoft.com": "copilot",
  "claude.ai": "claude",
};

function hostLabel(host: string): string | null {
  const h = host.toLowerCase().replace(/^www\./, "");
  return AI_HOSTS[h] ?? null;
}

/** Fixed label for the AI assistant behind a visit, from the referrer or a utm_source tag; null otherwise. */
export function aiSource(referrer: string, pageUrl: string): string | null {
  try {
    const utm = new URL(pageUrl).searchParams.get("utm_source");
    if (utm) {
      const label = hostLabel(utm);
      if (label) return label;
    }
  } catch {
    // ignore a malformed page URL
  }
  if (!referrer) return null;
  try {
    return hostLabel(new URL(referrer).hostname);
  } catch {
    return null;
  }
}
