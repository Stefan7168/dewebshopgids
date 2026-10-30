import type { NextRequest } from "next/server";
import { listedSvg } from "@/lib/badge/svg";
import { getShop } from "@/lib/shops/data";

// The free "Vermeld op" embed: served while the shop page is public (published, or disputed and still
// shown), 404 otherwise, so a removed shop's embed shows nothing. Under /badge so it is reachable without the pre-launch password.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = /^[a-z0-9-]{1,100}$/.test(slug) ? await getShop(slug) : null;
  if (!shop) return new Response("Not found", { status: 404 });
  return new Response(listedSvg(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
