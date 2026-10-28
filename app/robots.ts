import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Plan v3 section 9: keep crawlers out of redirects, admin, API and the dispute form.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/go/", "/admin/", "/api/", "/auth/", "/herbeoordeling", "/zoeken"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
