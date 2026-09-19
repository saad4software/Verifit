# 01: Core Database, Auth Scaffolding & Migration Seam

**What to build:** A working, fully tested SQLite database and Drizzle ORM persistence layer using LibSQL client, wired to the Better Auth server configuration with versioned SQL migrations and programmatic runner. A developer or test runner can spin up an in-memory database and run migrations programmatically to persist and query users and sessions.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] LibSQL client and Drizzle ORM initialized to support both local file storage and in-memory test databases
- [x] Better Auth server instance configured with Drizzle adapter and admin plugin for role support
- [x] Drizzle Kit configuration generated with versioned SQL migrations in `drizzle/`
- [x] Programmatic migrator utility created to execute migrations on demand
- [x] Vitest test suite running against an in-memory SQLite database (`:memory:`) verifying migration execution and entity persistence
