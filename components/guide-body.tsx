import Link from "next/link";
import { parseGuideMarkdown, type Inline } from "@/lib/guide/markdown";

type Live = ReadonlySet<string> | undefined;

// A shop that left the gids (removed, or no longer published) keeps its words but loses the link.
const isDeadShopLink = (href: string, live: Live) => !!live && href.startsWith("/webshop/") && !live.has(href.slice("/webshop/".length));

function Inlines({ items, live }: { items: Inline[]; live: Live }) {
  return (
    <>
      {items.map((i, n) =>
        i.kind === "bold" ? (
          <strong key={n}>{i.text}</strong>
        ) : i.kind === "link" && !isDeadShopLink(i.href, live) ? (
          <Link key={n} href={i.href} className="underline">{i.text}</Link>
        ) : (
          <span key={n}>{i.text}</span>
        ),
      )}
    </>
  );
}

/**
 * The gids body as React elements: only the safe Markdown subset, never raw HTML.
 * With liveShops (slugs of shops that still have a page), links to any other /webshop/ page become plain text.
 * `max-w-prose` keeps lines readable on a tablet (about 65 characters instead of 90+ across the full column).
 */
export function GuideBody({ md, liveShops }: { md: string; liveShops?: ReadonlySet<string> }) {
  return (
    <div className="flex max-w-prose flex-col gap-4 md:text-lg md:leading-8">
      {parseGuideMarkdown(md).map((b, n) =>
        b.kind === "heading" ? (
          <h2 key={n} className="text-xl font-semibold mt-2"><Inlines items={b.inlines} live={liveShops} /></h2>
        ) : (
          <p key={n}><Inlines items={b.inlines} live={liveShops} /></p>
        ),
      )}
    </div>
  );
}
