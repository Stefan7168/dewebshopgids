// Only addresses in ADMIN_EMAILS (comma separated) may use /admin.
// Any other Supabase user is treated as signed out.
export function isAdminEmail(
  email: string | undefined,
  allowlist = process.env.ADMIN_EMAILS ?? "",
): boolean {
  if (!email) return false;
  const allowed = allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
