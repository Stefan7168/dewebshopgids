import { BADGE_MIN_SCORE } from "@/lib/badge/pricing";

type Shop = { status: string; score: number | null; verified_badge_until: string | null };
export type BadgeEligibility = { kind: "can_buy" } | { kind: "active"; until: string } | { kind: "not_published" } | { kind: "score_too_low" };

/** Who may buy the badge: a published shop with score 70+ that has no running badge. */
export function badgeEligibility(s: Shop, today = new Date().toISOString().slice(0, 10)): BadgeEligibility {
  if (s.verified_badge_until && s.verified_badge_until >= today) return { kind: "active", until: s.verified_badge_until };
  if (s.status !== "published") return { kind: "not_published" };
  if ((s.score ?? 0) < BADGE_MIN_SCORE) return { kind: "score_too_low" };
  return { kind: "can_buy" };
}

/** Why checkout did not start. The code goes into /geverifieerd?fout=<code>; anything else shows the general text. */
export type CheckoutBlock = "link" | "actief" | "niet_gepubliceerd" | "score";

export const CHECKOUT_BLOCK_TEXT: Record<CheckoutBlock, string> = {
  link: "Je link is verlopen of klopt niet. Vraag op je pagina in de gids een nieuwe link aan en open die vanuit je e-mail.",
  actief: "Je badge staat al aan. Je hoeft niet nog een keer te betalen.",
  niet_gepubliceerd: "De badge kan pas als je pagina in de gids staat. Je hebt niets betaald.",
  score: `De badge is voor webshops met een echtheidsscore van ${BADGE_MIN_SCORE} of hoger. Je hebt niets betaald.`,
};

export function isCheckoutBlock(v: unknown): v is CheckoutBlock {
  return typeof v === "string" && Object.hasOwn(CHECKOUT_BLOCK_TEXT, v);
}

/**
 * The gate in front of Stripe: payment may only start for a live claim link of a shop that can buy.
 * Returns null when checkout may start. Runs on the server, right before the session is created.
 */
export function checkoutBlock(
  claim: { expires_at: string } | null,
  shop: Shop | null,
  now = new Date(),
): CheckoutBlock | null {
  if (!claim || !shop || new Date(claim.expires_at) < now) return "link";
  const e = badgeEligibility(shop, now.toISOString().slice(0, 10));
  if (e.kind === "active") return "actief";
  if (e.kind === "not_published") return "niet_gepubliceerd";
  if (e.kind === "score_too_low") return "score";
  return null;
}
