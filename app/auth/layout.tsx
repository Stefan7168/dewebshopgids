import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

// Admin login pages: a clear tab title, the legal footer like every other page, never indexed.
export const metadata: Metadata = { title: "Inloggen | De Webshopgids", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
