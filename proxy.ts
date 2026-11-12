import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isAuthorized, isPublicPath } from "@/lib/auth/basic-auth";
import { goneResponse, removedSlugs } from "@/lib/shops/removed";
import { isUnlisted } from "@/lib/shops/listed";
import { keurmerkPageBySlug } from "@/lib/keurmerk/pages";

export async function proxy(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;
  const { pathname } = request.nextUrl;

  if (
    user &&
    password &&
    !isPublicPath(pathname) &&
    !isAuthorized(request.headers.get("authorization"), user, password)
  ) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="dewebshopgids"' },
    });
  }

  // A removed shop's page is gone for good: 410, so search engines drop it at once.
  const shop = pathname.match(/^\/webshop\/([a-z0-9-]+)\/?$/);
  if (shop && (await removedSlugs()).has(shop[1])) {
    return goneResponse();
  }
  // Any other unknown shop, category, gids issue or keurmerk: a real 404 (the pages alone stream a 200).
  // The rewrite target has no route, so Next.js serves the not-found page with status 404.
  if (await isUnknownPage(pathname)) {
    return NextResponse.rewrite(new URL("/pagina-niet-gevonden", request.url));
  }

  return await updateSession(request);
}

async function isUnknownPage(pathname: string): Promise<boolean> {
  const m = pathname.match(/^\/(webshop|categorie|gids|keurmerk)\/([^/]+)\/?$/);
  if (!m) return false;
  const [, section, slug] = m;
  if (section === "keurmerk") return !keurmerkPageBySlug(slug);
  if (!/^[a-z0-9-]+$/.test(slug)) return false; // odd spellings: let the page decide
  return isUnlisted(section === "webshop" ? "shop" : section === "categorie" ? "category" : "guide", slug);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
