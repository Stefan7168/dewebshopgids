// URL slugs for shops and categories: lowercase ASCII words joined by "-".
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** First free slug: base, base-2, base-3, ... */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || "webshop";
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Slug base for a shop: its name, else the domain without the TLD. */
export function shopSlugBase(name: string | null, domain: string): string {
  return slugify(name ?? "") || slugify(domain.replace(/\.[a-z]+$/, ""));
}
