import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { badgeAction, verifyStripeSignature } from "@/lib/stripe/webhook";
import { createServiceClient } from "@/lib/supabase/service";

// Stripe calls this for the "Geverifieerd" badge and the "Uitgelicht" placement (plan v3 sections 10
// and 12). It only sets or clears shops.verified_badge_until or a featured_placements row; neither
// touches score or order.
/** PostgREST and Postgres codes for a table that does not exist (yet). */
const MISSING_TABLE = ["PGRST205", "42P01"];

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

  const shops = db.from("shops");
  const { data, error } =
    action.kind === "link"
      ? await shops.update({ stripe_subscription_id: action.subscriptionId, verified_badge_until: action.until }).eq("id", action.shopId).select("id")
      : action.kind === "extend"
        ? await shops.update({ verified_badge_until: action.until }).eq("stripe_subscription_id", action.subscriptionId).select("id")
        : await shops.update({ verified_badge_until: null, stripe_subscription_id: null }).eq("stripe_subscription_id", action.subscriptionId).select("id");
  // A 500 makes Stripe retry, which also covers an invoice.paid that arrives before its checkout.
  if (error) return NextResponse.json({ ok: false, error: "database" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ ok: false, error: "no shop for this payment" }, { status: action.kind === "end" ? 200 : 500 });
  revalidateTag("shops", "max");
  return NextResponse.json({ ok: true, action: action.kind });
}
