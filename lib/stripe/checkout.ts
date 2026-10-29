// Stripe Checkout Session for the "Geverifieerd" badge. No Stripe SDK, like lib/stripe/webhook.ts:
// one form-encoded POST to /v1/checkout/sessions. The webhook links the payment to the shop through
// client_reference_id, exactly as it does for the Payment Link.
import type { BadgePlan, CheckoutConfig } from "@/lib/badge/pricing";

export const CHECKOUT_URL = "https://api.stripe.com/v1/checkout/sessions";

export function checkoutForm(shopId: string, plan: BadgePlan["key"], config: CheckoutConfig, siteUrl: string): URLSearchParams {
  return new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": config.prices[plan],
    "line_items[0][quantity]": "1",
    client_reference_id: shopId,
    "metadata[product]": "badge",
    "subscription_data[metadata][product]": "badge",
    "subscription_data[metadata][shop_id]": shopId,
    locale: "nl",
    success_url: `${siteUrl}/geverifieerd?betaald=1`,
    cancel_url: `${siteUrl}/geverifieerd`,
  });
}

/** Returns the hosted checkout URL, or null when Stripe refuses (the caller shows a plain error). */
export async function createBadgeCheckout(
  shopId: string,
  plan: BadgePlan["key"],
  config: CheckoutConfig,
  siteUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const res = await fetchImpl(CHECKOUT_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${config.secretKey}`, "content-type": "application/x-www-form-urlencoded" },
    body: checkoutForm(shopId, plan, config, siteUrl),
  });
  if (!res.ok) {
    console.error("stripe checkout failed", res.status);
    return null;
  }
  const url = ((await res.json()) as { url?: unknown }).url;
  return typeof url === "string" && url.startsWith("https://checkout.stripe.com/") ? url : null;
}
