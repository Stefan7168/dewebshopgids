"use client";

import { useEffect } from "react";
import { parseUtm } from "@/lib/newsletter/utm";

export const UTM_STORAGE_KEY = "dwg_utm";

/** Remembers the UTM tags of the landing page for this browser tab, so a sign-up on a later page still carries them. */
export function UtmCapture() {
  useEffect(() => {
    const utm = parseUtm(window.location.search);
    if (!utm) return;
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    } catch {
      // storage blocked: the sign-up on this page still reads the URL
    }
  }, []);
  return null;
}

/** The UTM tags of this visit: from the current URL, else from the landing page. */
export function currentUtm(): string {
  const fromUrl = parseUtm(window.location.search);
  if (fromUrl) return JSON.stringify(fromUrl);
  try {
    return sessionStorage.getItem(UTM_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}
