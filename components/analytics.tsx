"use client";

import { useEffect } from "react";
import { aiSource } from "@/lib/analytics/ai-referrer";

// PostHog EU, cookieless and without person profiles (plan v3 section 14, risk 9):
// no persistent ID, so no consent banner is needed. Autocapture and recordings stay off.
// Loaded after hydration so it never weighs on the first paint.
// Docs: https://posthog.com/docs/privacy/cookieless-tracking
export function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    // Computed before init so the first pageview carries it too. Only a fixed label, never the referrer URL.
    const source = aiSource(document.referrer, window.location.href);
    void import("posthog-js").then(({ default: posthog }) => {
      if (posthog.__loaded) return;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
        cookieless_mode: "always",
        person_profiles: "never",
        autocapture: false,
        disable_session_recording: true,
        disable_surveys: true,
        capture_pageview: "history_change",
        capture_pageleave: false,
        before_send: (event) => {
          if (event && source) event.properties.ai_source = source;
          return event;
        },
      });
    });
  }, []);
  return null;
}
