// Pinterest post step (plan v3 sections 3 and 11): posts pins Stefan approved in /admin/pins (gate G3).
// Nightly pipeline step, pipeline role. Needs PINTEREST_ACCESS_TOKEN (from Stefan's Pinterest app, scope
// pins:write) and PINTEREST_BOARDS, a JSON map from our board slugs to Pinterest board ids, e.g.
// {"wonen":"123","tuin":"456","eten":"789","gids":"012"}. Without them the step does nothing.
// Every pin links to our own page with UTM tags, never to a shop or an affiliate link.
// Docs: https://developers.pinterest.com/docs/api/v5/pins-create
import type { Sql } from "../../../agents/shared/audit";
import { SITE } from "../../../lib/site";

export const MAX_POSTS_PER_RUN = 10;
type Fetch = typeof fetch;
export type ApprovedPin = { id: string; target_path: string; title: string; description: string; board: string };

/** The Pinterest request body for one pin. The image is the site's share image. */
export function pinBody(pin: ApprovedPin, boardId: string) {
  return {
    board_id: boardId,
    title: pin.title,
    description: pin.description,
    link: `${SITE.url}${pin.target_path}?utm_source=pinterest&utm_medium=social&utm_campaign=pins`,
    alt_text: pin.title,
    media_source: { source_type: "image_url", url: `${SITE.url}/opengraph-image.png` },
  };
}

export function parseBoards(raw: string | undefined): Record<string, string> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const out = Object.fromEntries(Object.entries(v).filter(([k, id]) => /^[a-z0-9-]{1,40}$/.test(k) && typeof id === "string" && /^\d{1,30}$/.test(id)));
    return Object.keys(out).length ? (out as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export async function postPins(sql: Sql, env: Record<string, string | undefined> = process.env, f: Fetch = fetch): Promise<{ summary: string }> {
  const token = env.PINTEREST_ACCESS_TOKEN;
  const boards = parseBoards(env.PINTEREST_BOARDS);
  if (!token || !boards) return { summary: "not configured (PINTEREST_ACCESS_TOKEN or PINTEREST_BOARDS missing)" };
  // Pins for a board without an id wait (they never block the queue). A pin for a shop page waits
  // while that shop is not published, e.g. after a removal request between approval and posting.
  const pins = await sql<ApprovedPin[]>`
    select d.id, d.target_path, d.title, d.description, d.board from public.pin_drafts d
    where d.status = 'approved' and d.board = any(${Object.keys(boards)})
      and (d.target_path not like '/webshop/%'
           or exists (select 1 from public.shops s where s.status = 'published' and '/webshop/' || s.slug = d.target_path))
    order by d.created_at limit ${MAX_POSTS_PER_RUN}`;
  let posted = 0;
  for (const pin of pins) {
    const boardId = boards[pin.board];
    const res = await f("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(pinBody(pin, boardId)),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`pinterest ${res.status} after ${posted} posted: ${(await res.text()).slice(0, 200)}`);
    const { id } = (await res.json()) as { id?: string };
    await sql`
      update public.pin_drafts set status = 'posted', posted_at = now(), pinterest_pin_id = ${id ?? null}
      where id = ${pin.id} and status = 'approved'`;
    posted++;
  }
  return { summary: `posted ${posted} of ${pins.length} approved pins ready to post` };
}
