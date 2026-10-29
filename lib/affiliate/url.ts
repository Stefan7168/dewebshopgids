// Validation for affiliate links entered in /admin/affiliate. The link comes from the
// network dashboard (Daisycon first), is stored as is in shops.affiliate_url and is only
// ever used by /go/[slug] as a redirect target, so it must be https and not point at us.
import { SITE } from "@/lib/site";

export type AffiliateInput = { ok: true; url: string | null } | { ok: false; error: string };

/** Empty input clears the link. Otherwise: a full https URL, at most 2000 characters, not on our own domain. */
export function parseAffiliateUrl(raw: string): AffiliateInput {
  const value = raw.trim();
  if (!value) return { ok: true, url: null };
  if (value.length > 2000) return { ok: false, error: "link is langer dan 2000 tekens" };
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return { ok: false, error: "geen geldige link" };
  }
  if (u.protocol !== "https:") return { ok: false, error: "link moet met https:// beginnen" };
  if (u.username || u.password) return { ok: false, error: "link mag geen inloggegevens bevatten" };
  const host = u.hostname.toLowerCase();
  if (host === SITE.domain || host.endsWith(`.${SITE.domain}`) || host.endsWith(".vercel.app")) {
    return { ok: false, error: "link wijst naar onze eigen site" };
  }
  return { ok: true, url: u.toString() };
}
