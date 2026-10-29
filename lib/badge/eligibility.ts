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
