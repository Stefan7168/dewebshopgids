import { describe, expect, it } from "vitest";
import { checkAdminClosed, checkPublicPage, checkRobots, checkSitemap, checkVercelCopyClosed, checkWwwRedirect, runChecks, type Probe } from "./go-live-check";

const base = "https://dewebshopgids.nl";
const p = (status: number, body = "", location: string | null = null): Probe => ({ status, body, location });
const robots = `User-Agent: *\nAllow: /\nDisallow: /go/\nDisallow: /admin/\nDisallow: /api/\nDisallow: /auth/\nDisallow: /herbeoordeling\nDisallow: /zoeken\n\nSitemap: ${base}/sitemap.xml\n`;
const sitemap = `<urlset><url><loc>${base}/</loc></url><url><loc>${base}/webshop/a</loc></url></urlset>`;

describe("go-live checks", () => {
  it("wants public pages open and without noindex", () => {
    expect(checkPublicPage("/", p(200, "<html></html>")).ok).toBe(true);
    expect(checkPublicPage("/", p(401)).ok).toBe(false);
    expect(checkPublicPage("/", p(200, '<meta name="robots" content="noindex, follow"/>')).ok).toBe(false);
  });
  it("checks robots.txt against the rules in app/robots.ts", () => {
    expect(checkRobots(base, p(200, robots)).ok).toBe(true);
    expect(checkRobots(base, p(200, robots.replace("Disallow: /admin/\n", ""))).detail).toContain("/admin/");
    expect(checkRobots(base, p(200, robots.replace(`Sitemap: ${base}/sitemap.xml`, ""))).ok).toBe(false);
  });
  it("wants a sitemap with only URLs on the real domain", () => {
    expect(checkSitemap(base, p(200, sitemap)).ok).toBe(true);
    expect(checkSitemap(base, p(200, sitemap.replace(`${base}/webshop/a`, "https://dewebshopgids.vercel.app/webshop/a"))).ok).toBe(false);
    expect(checkSitemap(base, p(200, "<urlset></urlset>")).ok).toBe(false);
  });
  it("wants /admin closed, www redirected and the vercel.app copy protected", () => {
    expect(checkAdminClosed(p(307, "", "/auth/login")).ok).toBe(true);
    expect(checkAdminClosed(p(200)).ok).toBe(false);
    expect(checkWwwRedirect(base, p(308, "", `${base}/`)).ok).toBe(true);
    expect(checkWwwRedirect(base, p(200)).ok).toBe(false);
    expect(checkVercelCopyClosed(p(401)).ok).toBe(true);
    expect(checkVercelCopyClosed(p(200)).ok).toBe(false);
    expect(checkVercelCopyClosed(p(0)).ok).toBe(false);
    expect(checkAdminClosed(p(0)).ok).toBe(false);
  });
  it("runs every check through the given fetcher, without the network", async () => {
    const answers: Record<string, Probe> = {
      [`${base}/robots.txt`]: p(200, robots),
      [`${base}/sitemap.xml`]: p(200, sitemap),
      [`${base}/admin`]: p(307, "", "/auth/login"),
      "https://www.dewebshopgids.nl/": p(308, "", `${base}/`),
      "https://dewebshopgids.vercel.app/": p(401),
    };
    const seen: string[] = [];
    const checks = await runChecks(base, async (u) => (seen.push(u), answers[u] ?? p(200, "<html></html>")), ["/categorie/meubels"]);
    expect(checks.every((c) => c.ok)).toBe(true);
    expect(seen).toContain(`${base}/categorie/meubels`);
    expect(seen).toContain(`${base}/webshop/a`);
  });
});
