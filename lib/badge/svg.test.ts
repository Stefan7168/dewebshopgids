import { describe, expect, it } from "vitest";
import { badgeEmbed, badgeSvg, listedEmbed, listedSvg } from "./svg";

describe("badge", () => {
  it("is a static SVG with the score and no script", () => {
    const svg = badgeSvg(84);
    expect(svg).toContain("Geverifieerd");
    expect(svg).toContain("score 84");
    expect(svg).not.toMatch(/<script|href=|xlink/i);
    expect(badgeSvg(null)).not.toContain("score");
  });

  it("embeds as a link to the shop page", () => {
    expect(badgeEmbed("atelier-x")).toBe(
      '<a href="https://dewebshopgids.nl/webshop/atelier-x"><img src="https://dewebshopgids.nl/badge/atelier-x" width="200" height="56" alt="Geverifieerd door De Webshopgids"></a>',
    );
  });

  it("has a free listing embed that cannot be mistaken for the paid badge", () => {
    const svg = listedSvg();
    expect(svg).toContain("Vermeld op");
    expect(svg).not.toMatch(/Geverifieerd|score|<script|href=|xlink/i);
    expect(listedEmbed("atelier-x")).toBe(
      '<a href="https://dewebshopgids.nl/webshop/atelier-x"><img src="https://dewebshopgids.nl/badge/atelier-x/vermeld" width="200" height="56" alt="Vermeld op De Webshopgids"></a>',
    );
  });
});
