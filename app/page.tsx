import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 flex flex-col gap-6">
        <h1 className="text-3xl font-bold">De Webshopgids</h1>
        <p className="text-lg">
          Unieke en betrouwbare Nederlandse woonwinkels, onafhankelijk
          beoordeeld.
        </p>
        <p className="text-sm text-muted-foreground">
          Deze site is in opbouw. <Link href="/over" className="underline">Over ons</Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
