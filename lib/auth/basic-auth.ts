// Site-wide Basic Auth while the directory is private (removed at public launch).
// Paths in PUBLIC_PATHS stay reachable without a password, e.g. for Daisycon review.

// Daisycon reviews these before the site is public (plan section 5, phase 0).
export const PUBLIC_PATHS = ["/over", "/go", "/privacy", "/informatie-voor-webshops", "/api/health", "/api/revalidate"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Constant-time string compare, safe in the Edge runtime (no node:crypto).
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function isAuthorized(
  header: string | null,
  user: string,
  password: string,
): boolean {
  if (!header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  return (
    safeEqual(decoded.slice(0, sep), user) &&
    safeEqual(decoded.slice(sep + 1), password)
  );
}
