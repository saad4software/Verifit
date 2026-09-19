# Decoupled Domain Boundary Between App Auth and Sanity CMS

## Context
The repository houses both the consumer application and the Sanity Studio (`app/studio`). We needed to decide whether to integrate the application's user authentication with Sanity Studio access and content authors.

## Decision
We maintain strict domain separation:
- Better Auth and SQLite manage application end-users, roles, and consumer session state.
- Sanity Studio remains an independent CMS tool utilizing Sanity's native authentication and project role management.

## Consequences
- Sanity schema and editorial workflows are completely independent of local database migrations and auth state.
- Application users cannot access or tamper with Sanity Studio unless explicitly invited through Sanity's native management.
- Reversing this to role-gate Sanity Studio routes in Next.js middleware is straightforward if needed in the future.
