// Schema.org markup (plan v3 section 9): ItemList, BreadcrumbList, Organization, WebSite.
// Never AggregateRating or Review (CLAUDE.md section 7).
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // "<" is escaped so shop names cannot close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
