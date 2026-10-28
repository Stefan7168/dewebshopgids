import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Sql } from "../../../agents/shared/audit";
import { dateRange, fetchRows, importSearchConsole, serviceAccountJwt, type GscRow } from "./import";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const sa = { client_email: "importer@x.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString() };

describe("serviceAccountJwt", () => {
  it("is a valid RS256 token with the read-only scope", () => {
    const [h, c, s] = serviceAccountJwt(sa, 1_800_000_000_000).split(".");
    expect(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
    const claims = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claims).toMatchObject({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", iat: 1_800_000_000, exp: 1_800_003_600 });
  });
});

describe("dateRange", () => {
  it("covers the last 5 days up to yesterday", () => expect(dateRange(new Date("2026-11-10T01:00:00Z"))).toEqual({ startDate: "2026-11-05", endDate: "2026-11-09" }));
});

const row = (i: number): GscRow => ({ keys: ["2026-11-08", `https://dewebshopgids.nl/webshop/s${i}`, "meubels"], clicks: 1, impressions: 10, ctr: 0.1, position: 4.567 });

describe("fetchRows", () => {
  it("pages until a short page", async () => {
    const starts: number[] = [];
    const f = (async (_u: string, init: RequestInit) => {
      const { startRow } = JSON.parse(init.body as string);
      starts.push(startRow);
      return new Response(JSON.stringify({ rows: startRow === 0 ? Array.from({ length: 25_000 }, (_, i) => row(i)) : [row(1)] }));
    }) as unknown as typeof fetch;
    expect(await fetchRows("sc-domain:x.nl", "t", { startDate: "a", endDate: "b" }, f)).toHaveLength(25_001);
    expect(starts).toEqual([0, 25_000]);
  });
});

describe("importSearchConsole", () => {
  it("does nothing without credentials", async () =>
    expect((await importSearchConsole({} as Sql, {})).summary).toContain("not configured"));
});
