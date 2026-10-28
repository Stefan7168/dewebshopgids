import { describe, expect, it } from "vitest";
import { senderKey } from "./rate-limit";

describe("senderKey", () => {
  it("prefers x-real-ip, then the first x-forwarded-for entry", () => {
    expect(senderKey(new Headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "5.6.7.8" }))).toBe("1.2.3.4");
    expect(senderKey(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(senderKey(new Headers())).toBe("unknown");
  });
});
