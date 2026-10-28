import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { badgeAction, verifyStripeSignature } from "@/lib/stripe/webhook";
import { createServiceClient } from "@/lib/supabase/service";

// Stripe calls this for the "Geverifieerd" badge (plan v3 section 10). It only sets or clears
// shops.verified_badge_until and the subscription link; the badge never touches score or order.
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

  const shops = createServiceClient().from("shops");
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
