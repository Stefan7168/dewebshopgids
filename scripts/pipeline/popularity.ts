// "Meest bezocht deze maand" (plan v3 section 10, migration 0019): ranks published shops by
// outbound clicks of the last 30 days, bots left out. Only ranks are stored; a shop needs
// MIN_CLICKS clicks to get one. Nightly pipeline step after publish, pipeline role.
import type { Sql } from "../../agents/shared/audit";

export const POPULAR_DAYS = 30;
export const MIN_CLICKS = 3;
export const MAX_RANKED = 100;

export async function runPopularity(sql: Sql): Promise<{ summary: string }> {
  const ranked = await sql.begin(async (tx) => {
    await tx`delete from public.shop_popularity`;
    return tx`
      insert into public.shop_popularity (shop_id, rank)
      select shop_id, rank from (
        select c.shop_id, row_number() over (order by count(*) desc, s.name) as rank
        from public.clicks c join public.shops s on s.id = c.shop_id
        where s.status = 'published' and coalesce(c.device, 'unknown') <> 'bot'
          and c.occurred_at > now() - ${`${POPULAR_DAYS} days`}::interval
        group by c.shop_id, s.name
        having count(*) >= ${MIN_CLICKS}
      ) r
      where rank <= ${MAX_RANKED}
      returning shop_id`;
  });
  return { summary: `ranked ${ranked.length} shop(s) with ${MIN_CLICKS}+ clicks in ${POPULAR_DAYS} days` };
}
