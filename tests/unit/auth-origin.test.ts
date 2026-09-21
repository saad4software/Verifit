import { describe, it, expect } from "vitest";
import { createAuthInstance } from "@/modules/auth/server";
import { runMigrations } from "@/db/migrate";

describe("Better Auth Origin and Deployment Configuration", () => {
  it("permits requests from Vercel preview deployment origins", async () => {
    const { db } = await runMigrations(":memory:");
    const authInstance = createAuthInstance(db);

    const req = new Request(
      "https://verifit-r316b6r47-alkentar.vercel.app/api/auth/sign-in/email",
      {
        method: "POST",
        headers: {
          origin: "https://verifit-r316b6r47-alkentar.vercel.app",
          cookie: "better-auth.session_token=dummy-cookie",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "wrongpassword123",
        }),
      }
    );

    const res = await authInstance.handler(req);
    // Should NOT be 403 INVALID_ORIGIN; instead fails auth credentials (401)
    expect(res.status).not.toBe(403);
    const data = (await res.json()) as { code?: string };
    expect(data.code).not.toBe("INVALID_ORIGIN");
  });

  it("rejects requests from untrusted external origins when origin check is active", async () => {
    const { betterAuth } = await import("better-auth");
    const testAuth = betterAuth({
      baseURL: "http://localhost:3000",
      secret: "secret-that-is-at-least-32-chars-long-12345",
      emailAndPassword: { enabled: true },
      trustedOrigins: ["https://*.vercel.app"],
      advanced: {
        disableOriginCheck: false,
      },
    });

    const req = new Request(
      "https://verifit-r316b6r47-alkentar.vercel.app/api/auth/sign-in/email",
      {
        method: "POST",
        headers: {
          origin: "https://malicious-domain.com",
          cookie: "better-auth.session_token=dummy-cookie",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      }
    );

    const res = await testAuth.handler(req);
    expect(res.status).toBe(403);
    const data = (await res.json()) as { code?: string };
    expect(data.code).toBe("INVALID_ORIGIN");
  });
});
