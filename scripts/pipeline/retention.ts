// Retention (plan v3 section 7): crawled page text older than 90 days is deleted (pages still
// in use are refetched before that), and resolved disputes lose the sender's address and message
// after 12 months. Nightly pipeline step after the crawl, pipeline role. Stated on /privacy and
// /informatie-voor-webshops; change those pages when these numbers change.
import type { Sql } from "../../agents/shared/audit";

export const CRAWL_TEXT_DAYS = 90;
export const DISPUTE_PERSONAL_DATA_MONTHS = 12;
export const ERASED_EMAIL = "verwijderd@invalid";

export async function runRetention(sql: Sql): Promise<{ summary: string }> {
  const pages = await sql`
    delete from public.crawl_pages where fetched_at < now() - ${`${CRAWL_TEXT_DAYS} days`}::interval returning id`;
  const disputes = await sql`
    update public.disputes set email = ${ERASED_EMAIL}, message = null
    where status = 'resolved' and coalesce(resolved_at, created_at) < now() - ${`${DISPUTE_PERSONAL_DATA_MONTHS} months`}::interval
      and email <> ${ERASED_EMAIL}
    returning id`;
  return { summary: `deleted ${pages.length} page text(s) older than ${CRAWL_TEXT_DAYS} days; erased address and message of ${disputes.length} old dispute(s)` };
}
