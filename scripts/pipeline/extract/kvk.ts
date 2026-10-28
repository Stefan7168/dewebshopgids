// KvK detection (plan v3 section 7, scoring step 1): an 8-digit number with
// "KvK" or "Kamer van Koophandel" within 30 characters. Stored as a boolean only.
export function hasKvkNumber(text: string): boolean {
  const flat = text.replace(/\s+/g, " ");
  const re = /(kvk|k\.v\.k\.|kamer van koophandel)[^0-9]{0,30}?(?<!\d)(\d[\d .]{6,10}\d)(?!\d)|(?<!\d)(\d{8})(?!\d)[^0-9]{0,30}?(kvk|kamer van koophandel)/gi;
  for (const m of flat.matchAll(re)) {
    const digits = (m[2] ?? m[3] ?? "").replace(/[ .]/g, "");
    if (/^\d{8}$/.test(digits)) return true;
  }
  return false;
}
