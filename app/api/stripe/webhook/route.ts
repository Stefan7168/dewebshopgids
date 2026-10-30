import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { paidLinkProblem, uitgelichtProblem } from "@/lib/badge/paid-link";
import { badgeAction, verifyStripeSignature } from "@/lib/stripe/webhook";
import { createServiceClient } from "@/lib/supabase/service";

// Stripe calls this for the "Geverifieerd" badge and the "Uitgelicht" placement (plan v3 sections 10
// and 12). It only sets or clears shops.verified_badge_until or a featured_placements row; neither
// touches score or order.
/** PostgREST and Postgres codes for a table that does not exist (yet). */
const MISSING_TABLE = ["PGRST205", "42P01"];

type Db = ReturnType<typeof createServiceClient>;

/** Subscriptions this webhook already refused: their escalation titles end with "(<problem>, <subscription id>)". */
async function refusedBefore(db: Db, subscriptionId: string): Promise<boolean | null> {
  const { data, error } = await db.from("agent_escalations").select("title").eq("agent", "stripe-webhook");
  if (error) return null;
  return (data ?? []).some((e) => e.title.endsWith(`, ${subscriptionId})`));
}

/**
 * Paid, but this shop may not have what it paid for: a person refunds or cancels in Stripe. Ids only; 200 so Stripe stops retrying.
 * One escalation per subscription: a retried or resent event does not file it again.
 */
async function refuseLink(db: Db, what: "badge" | "Uitgelicht", slug: string, subscriptionId: string, problem: string) {
  const seen = await refusedBefore(db, subscriptionId);
  if (seen === null) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
  if (seen) return NextResponse.json({ ok: true, ignored: problem });
  const { error } = await db.from("agent_escalations").insert({
    agent: "stripe-webhook",
    kind: what === "badge" ? "badge_payment_not_linked" : "uitgelicht_payment_not_linked",
    title: `Betaalde ${what} niet aangezet voor ${slug} (${problem}, ${subscriptionId})`,
    body_md: `Stripe subscription \`${subscriptionId}\` was paid (${what}) for shop \`${slug}\`, but it stays off: ${problem}. Refund or cancel it in the Stripe dashboard.`,
    label: "needs-human",
  });
  if (error) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
  return NextResponse.json({ ok: true, ignored: problem });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const action = badgeAction(event);
  if (action.kind === "ignore") return NextResponse.json({ ok: true, ignored: action.reason });

  const db = createServiceClient();
  if (action.kind === "link" && action.product === "uitgelicht") {
    const today = new Date().toISOString().slice(0, 10);
    const [shopRes, claimRes, slotRes] = await Promise.all([
      db.from("shops").select("slug, status, score").eq("id", action.shopId).maybeSingle(),
      db.from("shop_claims").select("id", { count: "exact", head: true }).eq("shop_id", action.shopId).not("verified_at", "is", null),
      db.from("featured_placements").select("stripe_subscription_id, active_until").eq("shop_id", action.shopId),
    ]);
    if (shopRes.error || claimRes.error || (slotRes.error && !MISSING_TABLE.includes(slotRes.error.code))) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
    const slots = slotRes.data ?? [];
    const shop = shopRes.data;
    const problem = shop
      ? uitgelichtProblem(shop, {
          alreadyLinked: slots.some((p) => p.stripe_subscription_id === action.subscriptionId),
          hasVerifiedClaim: (claimRes.count ?? 0) > 0,
          otherActiveSlot: slots.some((p) => p.stripe_subscription_id !== action.subscriptionId && p.active_until != null && p.active_until >= today),
        })
      : null;
    if (shop && problem) return refuseLink(db, "Uitgelicht", shop.slug, action.subscriptionId, problem);
    const { error } = await db
      .from("featured_placements")
      .upsert({ shop_id: action.shopId, stripe_subscription_id: action.subscriptionId, active_until: action.until }, { onConflict: "stripe_subscription_id" });
    if (error) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
    revalidateTag("shops", "max");
    return NextResponse.json({ ok: true, action: "link" });
  }
  if (action.kind !== "link") {
    // A renewal or cancellation names only the subscription: try the placements first, then the badge.
    const placements = db.from("featured_placements");
    const { data: placed, error } =
      action.kind === "extend"
        ? await placements.update({ active_until: action.until }).eq("stripe_subscription_id", action.subscriptionId).select("id")
        : await placements.update({ active_until: null }).eq("stripe_subscription_id", action.subscriptionId).select("id");
    // Until migration 0014 runs in production the table is missing; badge renewals must still work.
    if (error && !MISSING_TABLE.includes(error.code)) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
    if (placed?.length) {
      revalidateTag("shops", "max");
      return NextResponse.json({ ok: true, action: action.kind });
    }
  }

  if (action.kind === "link") {
    const { data: shop, error } = await db.from("shops").select("slug, status, score, verified_badge_until, stripe_subscription_id").eq("id", action.shopId).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
    const problem = shop ? paidLinkProblem(shop, action.subscriptionId) : null;
    if (shop && problem) return refuseLink(db, "badge", shop.slug, action.subscriptionId, problem);
  }

  const shops = db.from("shops");
  const { data, error } =
    action.kind === "link"
      ? await shops.update({ stripe_subscription_id: action.subscriptionId, verified_badge_until: action.until }).eq("id", action.shopId).select("id")
      : action.kind === "extend"
        ? await shops.update({ verified_badge_until: action.until }).eq("stripe_subscription_id", action.subscriptionId).select("id")
        : await shops.update({ verified_badge_until: null, stripe_subscription_id: null }).eq("stripe_subscription_id", action.subscriptionId).select("id");
  // A 500 makes Stripe retry, which also covers an invoice.paid that arrives before its checkout.
  if (error) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
  if (!data?.length) {
    // A renewal of a subscription we refused never finds a shop; retrying it would only fail again.
    if (action.kind === "extend" && (await refusedBefore(db, action.subscriptionId))) return NextResponse.json({ ok: true, ignored: "refused subscription" });
    return NextResponse.json({ ok: false, error: "no shop for this payment" }, { status: action.kind === "end" ? 200 : 500 });
  }
  revalidateTag("shops", "max");
  return NextResponse.json({ ok: true, action: action.kind });
}
