"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { cleanAnalyticsUrl } from "@/lib/analytics/clean-url";

/** Vercel Web Analytics: no cookies, no IP stored; tokens and private routes never leave the browser. */
export function Analytics() {
  return (
    <VercelAnalytics
      beforeSend={(event) => {
        const url = cleanAnalyticsUrl(event.url);
        return url ? { ...event, url } : null;
      }}
    />
  );
}
