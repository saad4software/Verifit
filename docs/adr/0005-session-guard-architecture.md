# Multi-Layer Session Guard via Next.js Middleware and Server Utilities

## Context
Protected areas (e.g. `/account`) require authentication verification before rendering and data retrieval. We needed to choose between decentralized page-level checks, client-side route protection, and edge-level middleware enforcement.

## Decision
We implement a two-layer defense guard:
1. **Next.js Middleware (`middleware.ts`)**: Intercepts inbound HTTP requests targeting protected routes (`/account/:path*`, etc.) and redirects unauthenticated requests to `/login?callbackUrl=...` before page rendering begins.
2. **Server Helper (`requireUser()`)**: Server components call a type-safe helper backed by `auth.api.getSession` to inject validated User and Session records directly into component props.

## Consequences
- Prevents protected page components from rendering unauthorized data or flashing unauthenticated UI states.
- Client bundles on protected routes are never executed if session cookies are absent.
- Preserves deep linking via `callbackUrl` redirects after successful authentication.
