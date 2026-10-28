// Where to go after an email link. Only a path on this site: "next" comes from the URL,
// so "https://evil.example" or "//evil.example" would make the link an open redirect.
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}
