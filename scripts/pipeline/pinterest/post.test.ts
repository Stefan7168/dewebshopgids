import { describe, expect, it } from "vitest";
import { parseBoards, pinBody } from "./post";

describe("pinBody", () => {
  it("links to our own page with UTM tags and its own image of the target page", () => {
    const b = pinBody({ id: "x", target_path: "/beste/webshops-meubels", title: "Unieke meubelwebshops", description: "Op echtheidsscore.", board: "wonen" }, "123");
    expect(b.board_id).toBe("123");
    expect(b.link).toBe("https://dewebshopgids.nl/beste/webshops-meubels?utm_source=pinterest&utm_medium=social&utm_campaign=pins");
    expect(b.media_source).toEqual({ source_type: "image_url", url: "https://dewebshopgids.nl/pin/beste/webshops-meubels" });
  });
});

describe("parseBoards", () => {
  it("keeps only slug to numeric id pairs", () => {
    expect(parseBoards('{"wonen":"123","tuin":"abc","Eten":"5"}')).toEqual({ wonen: "123" });
    expect(parseBoards("not json")).toBeNull();
    expect(parseBoards(undefined)).toBeNull();
    expect(parseBoards("{}")).toBeNull();
  });
});
