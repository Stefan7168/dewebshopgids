import { rankingExplanation } from "@/lib/shops/present";

// Directly above every ranked list (art. 6:193e lid 2 BW, CLAUDE.md section 7).
export function RankingDisclosure() {
  return (
    <details className="rounded-md border px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">Hoe is deze volgorde bepaald?</summary>
      <div className="mt-3 flex flex-col gap-2 text-muted-foreground">
        {rankingExplanation().map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </details>
  );
}
