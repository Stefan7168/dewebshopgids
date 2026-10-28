import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { countryCode, deviceFromUserAgent, redirectTarget, refererPath, sourceTag } from "@/lib/clicks";

// Outbound click: log one row in clicks (no IP, no UA), then 302 to the shop.
// Only published shops redirect. Linked with rel="sponsored nofollow" and
// disallowed in robots.txt, so search engines do not follow it.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return new NextResponse("Not found", { status: 404 });

  const supabase = createServiceClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, domain, affiliate_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!shop) return new NextResponse("Not found", { status: 404 });

  const { error } = await supabase.from("clicks").insert({
    shop_id: shop.id,
    referer_path: refererPath(request.headers.get("referer"), request.nextUrl.host),
    source: sourceTag(request.nextUrl.searchParams.get("bron")),
    device: deviceFromUserAgent(request.headers.get("user-agent")),
    country: countryCode(request.headers.get("x-vercel-ip-country")),
  });
  if (error) console.error("click insert failed", error.message); // never block the visitor

  return NextResponse.redirect(redirectTarget(shop), {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
