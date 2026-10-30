// Local stand-in for Supabase's REST API (PostgREST), read-only, for `npm run dev:local`.
// It answers the anon reads the public site makes (categories, shops_public, guides_public, featured_public, shop_popularity, shop_tags)
// from the local dev database, as the real `anon` role, so RLS and grants apply exactly as in
// production. Only the subset of PostgREST that lib/ uses: select, eq/neq/gt/gte/lt/lte/in/is,
// order, limit, offset. Never point it at the real project.
import { createServer } from "node:http";
import postgres from "postgres";

const PORT = Number(process.env.REST_PORT ?? 54321);
const TABLES = new Set(["categories", "shops_public", "guides_public", "featured_public", "shop_popularity", "shop_tags"]);
const IDENT = /^[a-z_][a-z0-9_]*$/;
const OPS: Record<string, string> = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" };

const sql = postgres(process.env.DEV_DATABASE_URL ?? "postgres:///dewebshopgids_dev", { max: 4 });

const q = (id: string) => {
  if (!IDENT.test(id)) throw new Error(`bad identifier ${id}`);
  return `"${id}"`;
};

export function buildQuery(table: string, params: URLSearchParams): { text: string; values: unknown[] } {
  if (!TABLES.has(table)) throw new Error(`table ${table} is not served locally`);
  const values: unknown[] = [];
  const cols = (params.get("select") ?? "*").split(",").map((c) => c.trim()).filter(Boolean);
  const select = cols.length === 1 && cols[0] === "*" ? "*" : cols.map(q).join(", ");
  const where: string[] = [];
  for (const [key, raw] of params) {
    if (["select", "order", "limit", "offset"].includes(key)) continue;
    const dot = raw.indexOf(".");
    const op = raw.slice(0, dot);
    const val = raw.slice(dot + 1);
    if (OPS[op]) {
      values.push(val);
      where.push(`${q(key)}::text ${OPS[op]} $${values.length}`);
    } else if (op === "in") {
      values.push(val.replace(/^\(|\)$/g, "").split(",").map((v) => v.replace(/^"|"$/g, "")));
      where.push(`${q(key)}::text = any($${values.length})`);
    } else if (op === "is" && val === "null") {
      where.push(`${q(key)} is null`);
    } else {
      throw new Error(`filter ${key}=${raw} is not supported locally`);
    }
  }
  const order = (params.get("order") ?? "")
    .split(",")
    .filter(Boolean)
    .map((o) => {
      const [col, dir] = o.split(".");
      return `${q(col)} ${dir === "desc" ? "desc" : "asc"}`;
    });
  const limit = params.get("limit");
  const offset = params.get("offset");
  const text =
    `select ${select} from public.${q(table)}` +
    (where.length ? ` where ${where.join(" and ")}` : "") +
    (order.length ? ` order by ${order.join(", ")}` : "") +
    (limit ? ` limit ${Math.min(Number(limit) || 0, 1000)}` : " limit 1000") +
    (offset ? ` offset ${Number(offset) || 0}` : "");
  return { text, values };
}

if (process.argv[1]?.endsWith("rest.ts")) {
  createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (!m) return send(404, { code: "PGRST000", message: "only /rest/v1/<table> is served locally" });
    if (req.method !== "GET" && req.method !== "HEAD") return send(405, { code: "PGRST000", message: "read-only" });
    try {
      const { text, values } = buildQuery(m[1], url.searchParams);
      const rows = await sql.begin(async (tx) => {
        await tx`set local role anon`;
        return tx.unsafe(text, values as never[]);
      });
      if ((req.headers.accept ?? "").includes("application/vnd.pgrst.object+json")) {
        if (rows.length !== 1) return send(406, { code: "PGRST116", message: `${rows.length} rows` });
        return send(200, rows[0]);
      }
      send(200, rows);
    } catch (err) {
      send(400, { code: "PGRST100", message: (err as Error).message });
    }
  }).listen(PORT, () => console.log(`local REST on http://localhost:${PORT}/rest/v1`));
}
