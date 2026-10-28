// Apply manual corrections (migration 0011, DECISIONS 2026-10-28). Nightly pipeline step right
// before `publish`, pipeline role. Every active correction is written to shops again each night,
// so it wins over the crawl and rescoring. Unchanged columns are left alone (no updated_at churn).
// A score correction adds a scores row linked by override_id whenever the newest score is not
// that correction, so the newest score always matches what the site shows.
import type postgres from "postgres";
import type { Sql } from "../../agents/shared/audit";
import { factColumns, isOverrideFact } from "../../lib/overrides/facts";
import { LABEL_BELOW, MARKETPLACE_LABEL } from "../../lib/scoring/weights";

/** JSON with sorted keys, to compare jsonb columns regardless of key order. */
export function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

/** The columns whose current value differs from the correction. */
export function changedColumns(current: Record<string, unknown>, wanted: Record<string, unknown>): string[] {
  return Object.keys(wanted).filter((c) => stable(current[c]) !== stable(wanted[c]));
}

type FactRow = { id: string; shop_id: string; fact: string; value: Record<string, unknown>; status: string };
type ScoreOverride = { id: string; shop_id: string; new_total: number; status: string };
type LatestScore = { run_id: string | null; score_version: string; sub_scores: Record<string, unknown>; caps_applied: string[]; override_id: string | null };

export async function applyOverrides(sql: Sql): Promise<{ summary: string }> {
  const [{ ready }] = await sql<{ ready: boolean }[]>`select to_regclass('public.fact_overrides') is not null as ready`;
  if (!ready) return { summary: "skipped: migration 0011 not applied yet" };

  let factWrites = 0;
  const bad: string[] = [];
  const facts = await sql<FactRow[]>`
    select id, shop_id, fact, value, status from public.fact_overrides
    where status in ('approved', 'applied') order by created_at`;
  for (const f of facts) {
    let wanted: Record<string, unknown>;
    try {
      if (!isOverrideFact(f.fact)) throw new Error(`unknown fact ${f.fact}`);
      wanted = factColumns(f.fact, f.value);
    } catch (err) {
      bad.push(`${f.id}: ${String(err instanceof Error ? err.message : err)}`);
      continue;
    }
    const [shop] = await sql<{ row: Record<string, unknown> }[]>`select to_jsonb(s) as row from public.shops s where id = ${f.shop_id}`;
    if (!shop) continue;
    const cols = changedColumns(shop.row, wanted);
    if (cols.length > 0) {
      const set: Record<string, postgres.ParameterOrJSON<never>> = Object.fromEntries(
        cols.map((c) => [c, c === "domain_age_sources" ? sql.json(wanted[c] as never) : (wanted[c] as postgres.ParameterOrJSON<never>)]),
      );
      await sql`update public.shops set ${sql(set, cols)} where id = ${f.shop_id}`;
      factWrites++;
    }
    if (f.status === "approved") await sql`update public.fact_overrides set status = 'applied', applied_at = now() where id = ${f.id}`;
  }

  let scoreWrites = 0;
  const scores = await sql<ScoreOverride[]>`
    select distinct on (shop_id) id, shop_id, new_total, status from public.score_overrides
    where status in ('approved', 'applied') and new_total is not null
    order by shop_id, created_at desc`;
  for (const o of scores) {
    const [latest] = await sql<LatestScore[]>`
      select run_id, score_version, sub_scores, caps_applied, override_id from public.scores
      where shop_id = ${o.shop_id} order by created_at desc limit 1`;
    const band = o.new_total < LABEL_BELOW ? "label" : "number";
    if (latest?.override_id !== o.id) {
      await sql`
        insert into public.scores (shop_id, run_id, score_version, total, sub_scores, caps_applied, model, prompt_version, override_id)
        values (${o.shop_id}, ${latest?.run_id ?? null}, ${latest?.score_version ?? "override"}, ${o.new_total},
                ${sql.json({ ...(latest?.sub_scores ?? {}), band } as never)},
                ${[...new Set([...(latest?.caps_applied ?? []), "manual_override"])]}, ${null}, ${"override"}, ${o.id})`;
      scoreWrites++;
    }
    const label = band === "label" ? MARKETPLACE_LABEL : null;
    await sql`
      update public.shops set score = ${o.new_total}, score_label = ${label}
      where id = ${o.shop_id} and (score is distinct from ${o.new_total} or score_label is distinct from ${label})`;
    if (o.status === "approved") await sql`update public.score_overrides set status = 'applied' where id = ${o.id}`;
  }

  const summary = `${facts.length} fact correction(s), ${factWrites} shop update(s); ${scores.length} score correction(s), ${scoreWrites} new score row(s)`;
  if (bad.length) throw new Error(`${summary}; invalid: ${bad.join("; ")}`);
  return { summary };
}
