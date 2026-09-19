# Root-Level Modular Directory Architecture

## Context
The project contains Next.js App Router routes in `/app` and Sanity studio in `/sanity` at the repository root. We needed a scalable structure for adding domain features (like authentication and database persistence) without scattering business logic across route handlers or forcing an invasive `src/` migration.

## Decision
We adopted a root-level `modules/` architectural pattern alongside a centralized `db/` connection layer:
- `modules/auth/`: Contains auth-specific schemas, Better Auth client/server configurations, UI components (login, register, account), server actions, and domain unit tests.
- `db/`: Contains Drizzle client setup, schema aggregations, and migration configs.
- `app/`: Thin presentation layer containing page routes and API handlers delegating to `modules/`.

## Consequences
- Route handlers remain thin adapters delegating logic to cohesive domain modules.
- New domain modules (e.g. `modules/cv`, `modules/billing`) can be added following identical encapsulation patterns without touching Next.js router setup.
