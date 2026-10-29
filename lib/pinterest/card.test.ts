import { describe, expect, it } from "vitest";
import { pinCard, pinImagePath } from "./card";

const categories = [{ id: "c1", slug: "meubels", name_nl: "Meubels", parent_id: null, intro_nl: null, seo_title: null, sort_order: 1 }];

describe("pinCard", () => {
  it("uses the shop name, category and numeric score", () => {
    const shop = { id: "s", slug: "a", name: "Houtatelier", domain: "houtatelier.nl", category_id: "c1", score: 91, score_label: null, status: "published" };
    expect(pinCard("webshop", "a", { shop: shop as never, categories })).toEqual({ kicker: "Meubels", title: "Houtatelier", line: "houtatelier.nl", score: 91 });
    expect(pinCard("webshop", "a", { shop: { ...shop, status: "disputed" } as never, categories })?.score).toBeNull();
  });
  it("returns null for pages that do not exist", () => {
    expect(pinCard("webshop", "x", { shop: null, categories })).toBeNull();
    expect(pinCard("beste", "geen-lijst", { categories })).toBeNull();
    expect(pinCard("categorie", "onbekend", { categories })).toBeNull();
    expect(pinCard("admin", "x", { categories })).toBeNull();
  });
  it("covers lists and categories", () => {
    expect(pinCard("beste", "webshops-meubels", { categories })?.title).toBe("De meest unieke webshops voor meubels");
    expect(pinCard("categorie", "meubels", { categories })?.title).toBe("Meubels");
  });
});

describe("pinImagePath", () => {
  it("maps a target page to its image route", () => {
    expect(pinImagePath("/webshop/a-b")).toBe("/pin/webshop/a-b");
  });
});
