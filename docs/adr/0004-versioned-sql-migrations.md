# Versioned SQL Migrations with Drizzle Kit and Programmatic Runner

## Context
We need a reliable mechanism to manage database schema evolutions that works consistently across local development, Vitest automated in-memory test suites, Playwright E2E testing, and production deployments.

## Decision
We will use `drizzle-kit generate` to produce deterministic, timestamped SQL migration files stored in `drizzle/`, paired with a programmatic migration runner (`drizzle-orm/libsql/migrator`) executed on application and test setup.

## Consequences
- Every schema change is captured as a human-reviewable, git-tracked SQL migration.
- Vitest suites running against `:memory:` and Playwright running against `file:test.db` execute migrations programmatically, eliminating schema drift between test and production environments.
- Direct schema mutations via `drizzle-kit push` are avoided to maintain migration integrity.
