import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("Session Guard Middleware (Ticket 04)", () => {
  it("allows public routes to pass without redirection", () => {
    const request = new NextRequest("http://localhost:3000/");
    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated requests targeting /account to /login with callbackUrl", () => {
    const request = new NextRequest("http://localhost:3000/account");
    const response = middleware(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeDefined();
    expect(location).toContain("/login?callbackUrl=%2Faccount");
  });

  it("allows requests targeting /account with valid session cookie", () => {
    const request = new NextRequest("http://localhost:3000/account", {
      headers: {
        cookie: "better-auth.session_token=test_valid_token_123",
      },
    });
    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
