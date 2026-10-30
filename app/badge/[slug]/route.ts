import type { NextRequest } from "next/server";
import { hiddenEmbed } from "@/lib/badge/hidden";
import { badgeSvg } from "@/lib/badge/svg";
import { getShop } from "@/lib/shops/data";
import { hasVerifiedBadge, scoreDisplay } from "@/lib/shops/present";

// Served only while the shop's paid badge is active; otherwise a 404 with an empty image, so an old embed shows nothing.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = /^[a-z0-9-]{1,100}$/.test(slug) ? await getShop(slug) : null;
  if (!shop || !hasVerifiedBadge(shop)) return hiddenEmbed();
  const score = scoreDisplay(shop);
  return new Response(badgeSvg(score.kind === "number" ? score.value : null), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
