import { badgeEligibility } from "@/lib/badge/eligibility";
import { BADGE_MIN_SCORE } from "@/lib/badge/pricing";

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

export type UitgelichtProblem = "not_published" | "score_too_low" | "no_verified_claim" | "second_slot";

/**
 * Who may pay for Uitgelicht (coordinator decision 2026-10-30, Stefan may reverse): a published shop
 * scoring at least the badge threshold, with a verified claim, and no other running Uitgelicht slot.
 * The Payment Link takes any shop id, so the webhook checks this. A retry of the same subscription
 * (`alreadyLinked`) always passes.
 */
export function uitgelichtProblem(
  shop: { status: string; score: number | null },
  facts: { alreadyLinked: boolean; hasVerifiedClaim: boolean; otherActiveSlot: boolean },
): UitgelichtProblem | null {
  if (facts.alreadyLinked) return null;
  if (shop.status !== "published") return "not_published";
  if ((shop.score ?? 0) < BADGE_MIN_SCORE) return "score_too_low";
  if (!facts.hasVerifiedClaim) return "no_verified_claim";
  if (facts.otherActiveSlot) return "second_slot";
  return null;
}
