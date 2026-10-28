import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { safeEqual } from "@/lib/auth/basic-auth";

// The publish job POSTs changed paths here (plan v3 section 8, step 9):
// Authorization: Bearer $REVALIDATE_SECRET, body {"paths": ["/webshop/x", ...]}.
const MAX_PATHS = 200;
const ALLOWED = /^\/(?:$|webshop\/[a-z0-9-]+$|categorie\/[a-z0-9-]+$|gids(?:\/[a-z0-9-]+)?$|over$)/;

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ") || !safeEqual(header.slice(7), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const paths = (body as { paths?: unknown })?.paths;
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > MAX_PATHS || !paths.every((p) => typeof p === "string" && ALLOWED.test(p))) {
    return NextResponse.json({ ok: false, error: "paths must be 1 to 200 site paths" }, { status: 400 });
  }
  revalidateTag("shops", "max"); // cached reads in lib/shops/data.ts and evidence.ts
  for (const p of paths as string[]) revalidatePath(p);
  return NextResponse.json({ ok: true, revalidated: paths.length });
}
