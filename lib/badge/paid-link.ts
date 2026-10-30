import { badgeEligibility } from "@/lib/badge/eligibility";

type Shop = { status: string; score: number | null; verified_badge_until: string | null; stripe_subscription_id: string | null };
export type PaidLinkProblem = "not_published" | "score_too_low" | "second_subscription";

/**
 * The webhook's own eligibility check for a paid badge. The /beheer checkout checks before Stripe,
 * but the fixed Payment Link (STRIPE_BADGE_LINK) takes any client_reference_id, so a payment can
 * name a shop that may not have the badge. Returns null when the payment may switch the badge on.
 * A retry of the same checkout (same subscription) is never a problem.
 */
export function paidLinkProblem(shop: Shop, subscriptionId: string, today = new Date().toISOString().slice(0, 10)): PaidLinkProblem | null {
  if (shop.stripe_subscription_id === subscriptionId) return null;
  const e = badgeEligibility(shop, today);
  if (e.kind === "active") return "second_subscription";
  if (e.kind === "not_published") return "not_published";
  if (e.kind === "score_too_low") return "score_too_low";
  return null;
}
