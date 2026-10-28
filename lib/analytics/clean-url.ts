// What Vercel Web Analytics may see of a URL. Confirmation and unsubscribe links carry
// tokens in the query string, so only utm_* parameters are kept: ChatGPT and other AI
// assistants tag their links with utm_source, which is how the AI-referrer segment works.
// Private routes are not tracked at all.
const PRIVATE_PREFIXES = ["/admin", "/auth", "/go/"];

/** The URL to send, or null to drop the event. */
export function cleanAnalyticsUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (PRIVATE_PREFIXES.some((p) => url.pathname === p.replace(/\/$/, "") || url.pathname.startsWith(p.endsWith("/") ? p : `${p}/`))) return null;
  const kept = new URLSearchParams();
  for (const [k, v] of url.searchParams) if (/^utm_[a-z]+$/.test(k)) kept.append(k, v.slice(0, 100));
  url.search = kept.toString();
  url.hash = "";
  return url.toString();
}
