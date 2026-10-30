import { cachedToday, getPublishedShops } from "@/lib/shops/data";
import { dutchDate } from "@/lib/shops/score-history-rules";
import { siteStats, statLines } from "@/lib/shops/stats";

/** Aggregate facts over all published shops, for /hoe-wij-beoordelen. Renders nothing below the minimum. */
export async function SiteStats() {
  const [shops, today] = await Promise.all([getPublishedShops(), cachedToday()]);
  const stats = siteStats(shops, today);
  if (!stats) return null;
  return (
    <>
      <h2>Wat we zagen bij {stats.shops} webshops</h2>
      <p>Van alle webshops die nu in De Webshopgids staan (stand op {dutchDate(today)}):</p>
      <ul>
        {statLines(stats).map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p>Deze cijfers komen uit onze eigen controle en worden elke nacht bijgewerkt. Je mag ze overnemen met een link naar deze pagina.</p>
    </>
  );
}
