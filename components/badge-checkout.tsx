import Link from "next/link";
import { startBadgeCheckout } from "@/app/beheer/actions";
import { Button } from "@/components/ui/button";
import { badgeEligibility } from "@/lib/badge/eligibility";
import { BADGE_MIN_SCORE, BADGE_PLANS, checkoutConfig, formatEur } from "@/lib/badge/pricing";
import { dutchDate } from "@/lib/shops/score-history-rules";

type Shop = { status: string; score: number | null; verified_badge_until: string | null };

/** Badge offer under the claim edit form. The token comes from the claim link, so only the owner sees it. */
export function BadgeCheckout({ token, shop }: { token: string; shop: Shop }) {
  const e = badgeEligibility(shop);
  return (
    <section className="flex flex-col gap-3 border-t pt-6">
      <h2 className="text-xl font-semibold">Badge Geverifieerd</h2>
      {e.kind === "active" && <p>Je badge staat aan tot en met {dutchDate(e.until)}. Hij verlengt vanzelf zolang je abonnement loopt.</p>}
      {e.kind === "not_published" && <p className="text-muted-foreground">De badge kan pas als je pagina in de gids staat.</p>}
      {e.kind === "score_too_low" && (
        <p className="text-muted-foreground">De badge is voor webshops met een echtheidsscore van {BADGE_MIN_SCORE} of hoger.</p>
      )}
      {e.kind === "can_buy" && (
        <>
          <p>
            Laat kopers zien dat je webshop bij jou hoort. De badge verandert niets aan je score of je plek in een lijst.{" "}
            <Link href="/geverifieerd" className="underline">
              Wat je krijgt
            </Link>
          </p>
          {checkoutConfig() ? (
            <form action={startBadgeCheckout} className="flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="t" value={token} />
              {BADGE_PLANS.map((p) => (
                <Button key={p.key} type="submit" name="plan" value={p.key} variant={p.key === "year" ? "default" : "outline"} className="h-11">
                  {formatEur(p.eur)} {p.label}
                </Button>
              ))}
            </form>
          ) : (
            <p className="rounded-md border p-4">
              <strong>Binnenkort.</strong> Betalen voor de badge kan nog niet.
            </p>
          )}
        </>
      )}
    </section>
  );
}
