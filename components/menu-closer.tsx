"use client";

import { useEffect } from "react";

/** Closes the header's no-JS menu (a <details data-menu>) on a tap outside it or on Escape. */
export function MenuCloser() {
  useEffect(() => {
    const close = (e: PointerEvent | KeyboardEvent) => {
      document.querySelectorAll<HTMLDetailsElement>("details[data-menu][open]").forEach((d) => {
        if (e instanceof KeyboardEvent) {
          if (e.key !== "Escape") return;
          d.open = false;
          d.querySelector("summary")?.focus();
        } else if (!d.contains(e.target as Node)) {
          d.open = false;
        }
      });
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  return null;
}
