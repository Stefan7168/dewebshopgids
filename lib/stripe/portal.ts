// Stripe customer portal for the badge: cancel, change card, download invoices. Opening it is as easy
// as buying (one button on the claim page). No Stripe SDK, like lib/stripe/checkout.ts. The portal
// itself is configured once in the Stripe dashboard (Settings > Billing > Customer portal).
const API = "https://api.stripe.com/v1";

/** Returns the portal URL for the customer behind a subscription, or null when Stripe refuses. */
export async function createPortalSession(
  subscriptionId: string,
  secretKey: string,
  returnUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (!/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) return null;
  const auth = { authorization: `Bearer ${secretKey}` };
  const sub = await fetchImpl(`${API}/subscriptions/${subscriptionId}`, { headers: auth });
  if (!sub.ok) {
    console.error("stripe subscription lookup failed", sub.status);
    return null;
  }
  const customer = ((await sub.json()) as { customer?: unknown }).customer;
  if (typeof customer !== "string") return null;
  const res = await fetchImpl(`${API}/billing_portal/sessions`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ customer, return_url: returnUrl, locale: "nl" }),
  });
  if (!res.ok) {
    console.error("stripe portal failed", res.status);
    return null;
  }
  const url = ((await res.json()) as { url?: unknown }).url;
  return typeof url === "string" && url.startsWith("https://billing.stripe.com/") ? url : null;
}
