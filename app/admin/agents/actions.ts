"use server";

import { revalidatePath } from "next/cache";
import { dispatchKillSwitch, isAgentName } from "@/lib/admin/ops";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

const REPO = process.env.ADMIN_GITHUB_REPO ?? "Stefan7168/dewebshopgids";

async function setSetting(key: string, value: unknown, email: string) {
  const { error } = await createServiceClient().from("agent_settings").update({ value, updated_by: `admin:${email}` }).eq("key", key);
  if (error) throw new Error(error.message);
}

export type KillResult = { note: string } | null;

/** Soft stop first (every job checks agents_enabled), then the hard stop: NOLOGIN on every agent role. */
export async function killAgents(_prev: KillResult, formData: FormData): Promise<KillResult> {
  const email = await requireAdmin();
  if (formData.get("confirm") !== "STOP") return { note: "Typ STOP om te bevestigen." };
  await setSetting("agents_enabled", false, email);
  const r = await dispatchKillSwitch(process.env.GITHUB_DISPATCH_TOKEN, REPO);
  revalidatePath("/admin/agents");
  return { note: `Alle agents staan uit. ${r.note}` };
}

/** Lifts the soft stop. Roles disabled by the kill workflow need scripts/agents/set-role-password.ts again. */
export async function enableAgents() {
  const email = await requireAdmin();
  await setSetting("agents_enabled", true, email);
  revalidatePath("/admin/agents");
}

/** The one unpause tap after a Watchdog pause (plan v3 section 3). */
export async function unpauseAgent(formData: FormData) {
  const email = await requireAdmin();
  const agent = String(formData.get("agent") ?? "");
  if (!isAgentName(agent)) throw new Error("invalid agent");
  await setSetting(`enabled.${agent}`, true, email);
  await setSetting(`paused_until.${agent}`, null, email);
  revalidatePath("/admin/agents");
}

/**
 * Stefan's go-ahead for pre-notice emails (launch step 7). Upsert: the key is not seeded, so the
 * nightly publish step reads "off" until this is pressed. Turning it on needs the word AAN.
 */
export async function setPrenotice(formData: FormData) {
  const email = await requireAdmin();
  const on = formData.get("on") === "true";
  if (on && formData.get("confirm") !== "AAN") return;
  const { error } = await createServiceClient()
    .from("agent_settings")
    .upsert({ key: "prenotice_enabled", value: on, updated_by: `admin:${email}` }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/agents");
}
