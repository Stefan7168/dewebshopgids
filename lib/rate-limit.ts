// Rate limits for the public forms and /go/. We store no IP address (CLAUDE.md section 7):
// the sender key lives only in this server instance's memory for the window.

/** Fixed-window counter in memory. Resets when the server instance restarts; the database limits are the backstop. */
export class MemoryLimiter {
  private hits = new Map<string, number[]>();
  constructor(private max: number, private windowMs: number) {}
  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.hits.clear(); // bound memory
    return true;
  }
}

/** The visitor's address as Vercel sets it (Vercel overwrites x-forwarded-for, so it cannot be spoofed there). Memory only. */
export function senderKey(h: Headers): string {
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
