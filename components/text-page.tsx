import { SiteFooter } from "@/components/site-footer";

// Shared layout for the plain text pages (/over, /privacy, /hoe-wij-beoordelen, /informatie-voor-webshops).
export function TextPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <article className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 flex flex-col gap-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_a]:underline">
        <h1 className="text-3xl font-bold">{title}</h1>
        {children}
      </article>
      <SiteFooter />
    </main>
  );
}
