import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isAuthorized, isPublicPath } from "@/lib/auth/basic-auth";
import { goneResponse, removedSlugs } from "@/lib/shops/removed";

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

  return await updateSession(request);
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
