"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { draftCutoff } from "./expiry";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function ids(formData: FormData): string[] {
  const list = formData.getAll("id").map(String);
  if (!list.length || list.length > 50 || !list.every((id) => UUID.test(id))) throw new Error("invalid pins");
  return list;
}

// G3 (plan v3 section 4): Stefan approves the weekly pin batch. The post job publishes approved pins.
async function decide(formData: FormData, status: "approved" | "rejected") {
  const email = await requireAdmin();
  const { error } = await createServiceClient()
    .from("pin_drafts")
    .update({ status, approved_by: email, decided_at: new Date().toISOString() })
    .in("id", ids(formData))
    .eq("status", "draft")
    .gt("created_at", draftCutoff());
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pins");
}

export async function approvePins(formData: FormData) {
  await decide(formData, "approved");
}

export async function rejectPins(formData: FormData) {
  await decide(formData, "rejected");
}
