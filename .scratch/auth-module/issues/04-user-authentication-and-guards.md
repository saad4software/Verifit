# 04: User Authentication, Route Protection & Sign Out

**What to build:** The complete sign-in and session security vertical. Registered users can navigate to `/login`, submit their credentials, view informative errors on failed attempts, and be redirected to their intended destination via `callbackUrl`. Unauthenticated attempts to reach private routes like `/account` are caught and redirected by Next.js middleware. Authenticated users can terminate their active session via a sign-out button in the header.

**Blocked by:** 03: User Registration & Immediate Session Establishment

**Status:** completed

- [x] `/login` page and `LoginForm` component with loading states and error notifications for invalid credentials
- [x] Preservation and redirect handling for `callbackUrl` query parameters upon successful login
- [x] Next.js `middleware.ts` intercepting protected routes (`/account/:path*`) and redirecting guests to `/login`
- [x] Global header sign-out action invoking Better Auth signOut and clearing client session state
- [x] Vitest tests verifying login submission, error handling, and session guard logic
