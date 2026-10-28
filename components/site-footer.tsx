import Link from "next/link";

// Footer identity. KvK number and contact address are filled in once
// registration is done (plan section 15, task 11).
export function SiteFooter() {
  return (
    <footer className="w-full border-t text-xs py-8">
      <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-4 justify-between">
        <span>De Webshopgids</span>
        <Link href="/over" className="underline">
          Over ons
        </Link>
      </div>
    </footer>
  );
}
