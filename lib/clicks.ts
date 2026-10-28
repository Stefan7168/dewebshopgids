// Pure helpers for /go/[slug]. We store no IP address and no user-agent string
// or hash (CLAUDE.md section 7): only a coarse device class, a same-site path,
// a short source tag and the country header Vercel sets.

export type Device = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export function deviceFromUserAgent(ua: string | null): Device {
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i.test(ua)) return "bot";
  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Path of the referring page, only when it is on our own host. */
export function refererPath(referer: string | null, ownHost: string): string | null {
  if (!referer) return null;
  try {
    const u = new URL(referer);
    return u.host === ownHost ? u.pathname.slice(0, 200) : null;
  } catch {
    return null;
  }
}

/** Short source tag from ?bron=, lowercase letters, digits and dashes only. */
export function sourceTag(value: string | null): string | null {
  if (!value) return null;
  const tag = value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  return tag || null;
}

export function countryCode(header: string | null): string | null {
  return header && /^[A-Z]{2}$/.test(header) ? header : null;
}

/** Where to send the visitor: the affiliate URL if it is https, else the shop's own domain. */
export function redirectTarget(shop: { domain: string; affiliate_url: string | null }): string {
  if (shop.affiliate_url) {
    try {
      const u = new URL(shop.affiliate_url);
      if (u.protocol === "https:") return u.toString();
    } catch {
      // fall through to the domain
    }
  }
  return `https://${shop.domain}/`;
}
