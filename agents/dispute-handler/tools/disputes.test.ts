import { describe, expect, it } from "vitest";
import { parseCorrections, parseFacts, replyDeadline, scoreGate } from "./disputes";

describe("replyDeadline", () => {
  const now = new Date("2026-10-28T09:00:00Z");
  it("uses the dispute deadline in Amsterdam time", () => expect(replyDeadline(new Date("2026-11-03T23:30:00Z"), now)).toBe("2026-11-04"));
  it("never promises a date before tomorrow", () => {
    expect(replyDeadline(new Date("2026-10-20T09:00:00Z"), now)).toBe("2026-10-29");
    expect(replyDeadline(null, now)).toBe("2026-10-29");
  });
});

describe("scoreGate", () => {
  it.each([
    [50, 60, "small"],
    [50, 39, "G4"],
    [null, 40, "G4"],
  ] as const)("%j to %j -> %j", (a, b, out) => expect(scoreGate(a, b)).toBe(out));
});

describe("parseFacts", () => {
  it("accepts known keys", () => expect(parseFacts("online, keurmerk")).toEqual(["online", "keurmerk"]));
  it("rejects unknown keys", () => expect(() => parseFacts("online,marketplace_pattern")).toThrow(/unknown fact/));
});

describe("parseCorrections", () => {
  it("accepts safe values", () => expect(parseCorrections('[{"fact":"online","value":"sinds 2015"}]')).toEqual([{ fact: "online", value: "sinds 2015" }]));
  it("rejects internal names and foreign links", () => {
    expect(() => parseCorrections('[{"fact":"score","value":"geen dropship"}]')).toThrow(/rejected/);
    expect(() => parseCorrections('[{"fact":"beschrijving","value":"zie concurrent.nl"}]')).toThrow(/rejected/);
  });
});
