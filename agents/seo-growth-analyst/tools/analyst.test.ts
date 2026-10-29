import { describe, expect, it } from "vitest";
import { change, forecastDue, pinProblem } from "./analyst";

describe("forecastDue", () => {
  it("is true in the first 7 days of the month in Amsterdam", () => {
    expect(forecastDue(new Date("2026-11-02T06:00:00Z"))).toBe(true);
    expect(forecastDue(new Date("2026-11-09T06:00:00Z"))).toBe(false);
    expect(forecastDue(new Date("2026-10-31T23:30:00Z"))).toBe(true); // already 1 November in Amsterdam
  });
});

describe("change", () => {
  it("rounds to whole percent", () => expect(change(130, 100)).toBe(30));
  it("is null without a base", () => expect(change(5, 0)).toBeNull());
});

describe("pinProblem", () => {
  const ok = { path: "/beste/webshops-meubels", title: "Unieke meubelwebshops", description: "Nederlandse meubelmakers, gerangschikt op echtheidsscore.", board: "wonen" };
  it("accepts a pin to one of our pages", () => expect(pinProblem(ok)).toBeNull());
  it("rejects shop links, unknown boards, banned words and bad lengths", () => {
    expect(pinProblem({ ...ok, path: "https://shop.nl/" })).toMatch(/our pages/);
    expect(pinProblem({ ...ok, path: "/go/houtatelier" })).toMatch(/our pages/);
    expect(pinProblem({ ...ok, board: "mode" })).toMatch(/board/);
    expect(pinProblem({ ...ok, description: "Lees onze review van deze shops." })).toMatch(/banned/);
    expect(pinProblem({ ...ok, description: "Nu met 20% korting op alles hier." })).toMatch(/banned/);
    expect(pinProblem({ ...ok, description: "Kijk op www.shop.nl voor meer info." })).toMatch(/banned/);
    expect(pinProblem({ ...ok, title: "Kort" })).toMatch(/title/);
  });
});
