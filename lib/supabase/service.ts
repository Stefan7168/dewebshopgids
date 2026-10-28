import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for trusted server code (admin actions, /go/ clicks).
// Bypasses RLS, so call it only after an explicit permission check.
// It still cannot publish a shop: the database trigger allows only `pipeline`.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
