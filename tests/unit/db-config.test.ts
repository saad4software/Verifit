import { describe, expect, it } from "vitest";
import { getTursoConfig } from "@/db/config";

describe("Turso configuration", () => {
  it("requires credentials even when legacy local configuration exists", () => {
    expect(() => getTursoConfig({ DATABASE_URL: "file:local.db" })).toThrow("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
    expect(() => getTursoConfig({ TURSO_DATABASE_URL: "libsql://test.turso.io" })).toThrow("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  });

  it.each(["file:local.db", ":memory:", "http://test.turso.io", "invalid"])("rejects unsupported URL %s", (url) => {
    expect(() => getTursoConfig({ TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "token" })).toThrow("TURSO_DATABASE_URL");
  });

  it.each(["libsql://test.turso.io", "https://test.turso.io"])("accepts hosted URL %s", (url) => {
    expect(getTursoConfig({ TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "token", DATABASE_URL: "file:local.db" })).toEqual({ url, authToken: "token" });
  });
});
