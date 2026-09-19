import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith("/account");

  if (isProtectedRoute) {
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
