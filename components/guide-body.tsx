import Link from "next/link";
import { parseGuideMarkdown, type Inline } from "@/lib/guide/markdown";

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((i, n) =>
        i.kind === "bold" ? <strong key={n}>{i.text}</strong> : i.kind === "link" ? <Link key={n} href={i.href} className="underline">{i.text}</Link> : <span key={n}>{i.text}</span>,
      )}
    </>
  );
}

/** The gids body as React elements: only the safe Markdown subset, never raw HTML. */
export function GuideBody({ md }: { md: string }) {
  return (
    <div className="flex flex-col gap-4">
      {parseGuideMarkdown(md).map((b, n) =>
        b.kind === "heading" ? (
          <h2 key={n} className="text-xl font-semibold mt-2"><Inlines items={b.inlines} /></h2>
        ) : (
          <p key={n}><Inlines items={b.inlines} /></p>
        ),
      )}
    </div>
  );
}
