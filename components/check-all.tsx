"use client";

import { Button } from "@/components/ui/button";

/** Ticks or unticks every checkbox called `name` in the surrounding form, so a phone needs one tap instead of a hundred. */
export function CheckAll({ name, checked, children }: { name: string; checked: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={(e) => {
        const form = e.currentTarget.closest("form");
        form?.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${name}"]`).forEach((box) => (box.checked = checked));
      }}
    >
      {children}
    </Button>
  );
}
