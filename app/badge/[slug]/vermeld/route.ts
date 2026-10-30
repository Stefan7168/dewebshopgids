import type { NextRequest } from "next/server";
import { hiddenEmbed } from "@/lib/badge/hidden";
import { listedSvg } from "@/lib/badge/svg";
import { getShop } from "@/lib/shops/data";

// The free "Vermeld op" embed: served while the shop page is public (published, or disputed and still
// shown), otherwise a 404 with an empty image, so a removed shop's embed shows nothing (no alt text). Under /badge so it is reachable without the pre-launch password.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = /^[a-z0-9-]{1,100}$/.test(slug) ? await getShop(slug) : null;
  if (!shop) return hiddenEmbed();
  return new Response(listedSvg(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
