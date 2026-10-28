import { scoreDisplay, type PublicShop } from "@/lib/shops/present";
import { cn } from "@/lib/utils";

export function ScoreBadge({ shop, size = "sm" }: { shop: Pick<PublicShop, "score" | "score_label" | "status">; size?: "sm" | "lg" }) {
  const d = scoreDisplay(shop);
  const box = size === "lg" ? "min-w-20 h-20 text-3xl" : "min-w-12 h-12 text-lg";
  if (d.kind === "number") {
    return (
      <div className={cn("shrink-0 rounded-lg bg-primary text-primary-foreground font-bold flex flex-col items-center justify-center px-2", box)}>
        <span>{d.value}</span>
        <span className="sr-only"> van 100</span>
      </div>
    );
  }
  const text = d.kind === "label" ? d.text : d.kind === "pending" ? "In beoordeling" : "Nog geen score";
  return (
    <div className={cn("shrink-0 rounded-lg border text-xs text-muted-foreground flex items-center justify-center text-center px-2", size === "lg" ? "h-20 max-w-32" : "h-12 max-w-24")}>
      {text}
    </div>
  );
}
