import { ImageResponse } from "next/og";
import { getGuide } from "@/lib/guide/data";
import { parseGuideSlug } from "@/lib/guide/week";
import { PIN_SIZE, pinCard } from "@/lib/pinterest/card";
import { getCategories, getShop } from "@/lib/shops/data";
import { SITE } from "@/lib/site";

// The 2:3 image Pinterest fetches for a pin (scripts/pipeline/pinterest/post.ts) and the approval page shows.
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new Response("Niet gevonden", { status: 404 });
  const [categories, shop, guide] = await Promise.all([
    getCategories(),
    kind === "webshop" ? getShop(slug) : null,
    kind === "gids" && parseGuideSlug(slug) ? getGuide(slug) : null,
  ]);
  const card = pinCard(kind, slug, { shop, guide, categories });
  if (!card) return new Response("Niet gevonden", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#f6f3ee", color: "#1c1917" }}>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 600 }}>{SITE.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", fontSize: 40, color: "#57534e" }}>{card.kicker}</div>
          <div style={{ display: "flex", fontSize: card.title.length > 40 ? 84 : 104, fontWeight: 700, lineHeight: 1.1 }}>{card.title}</div>
          <div style={{ display: "flex", fontSize: 40, color: "#57534e" }}>{card.line}</div>
          {card.score != null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 200, height: 200, borderRadius: 32, background: "#1c1917", color: "#fff", fontSize: 96, fontWeight: 700 }}>
                {card.score}
              </div>
              <div style={{ display: "flex", fontSize: 40 }}>Echtheidsscore van 1 tot 100</div>
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#57534e" }}>{SITE.domain}</div>
      </div>
    ),
    PIN_SIZE,
  );
}
