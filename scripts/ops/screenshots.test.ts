import { describe, expect, it } from "vitest";
import { judge, pickUrls } from "./screenshots";

const xml = `<urlset><url><loc>https://dewebshopgids.nl/</loc></url><url><loc>https://dewebshopgids.nl/webshop/a</loc></url>
<url><loc>https://dewebshopgids.nl/webshop/b</loc></url><url><loc>https://dewebshopgids.nl/gids</loc></url><url><loc>https://other.example/x</loc></url></urlset>`;

describe("pickUrls", () => {
  it("always starts with the home page and picks distinct pages of this site", () => {
    const urls = pickUrls(xml, "https://dewebshopgids.nl", 4, () => 0);
    expect(urls[0]).toBe("https://dewebshopgids.nl/");
    expect(urls.slice(1).sort()).toEqual(["https://dewebshopgids.nl/gids", "https://dewebshopgids.nl/webshop/a", "https://dewebshopgids.nl/webshop/b"]);
  });
  it("works without a sitemap", () => {
    expect(pickUrls("", "https://dewebshopgids.nl/", 4)).toEqual(["https://dewebshopgids.nl/"]);
  });
});

describe("judge", () => {
  const ok = { url: "https://dewebshopgids.nl/", status: 200, scrollWidth: 390, file: "1.png" };
  it("passes clean pages", () => {
    expect(judge([ok], false).status).toBe("ok");
  });
  it("fails on an error answer or sideways scroll", () => {
    const r = judge([ok, { ...ok, url: "u2", scrollWidth: 412 }, { ...ok, url: "u3", status: 500 }], false);
    expect(r.status).toBe("fail");
    expect(r.detail.problems).toEqual(["u2: 412px wide, scrolls sideways at 390px", "u3: status 500"]);
  });
  it("warns while the site is private without a password", () => {
    expect(judge([], true).status).toBe("warn");
  });
});
