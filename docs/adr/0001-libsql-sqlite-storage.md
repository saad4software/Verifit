# LibSQL Driver with SQLite for Application Storage

## Context
The application requires a lightweight relational database managed via Drizzle ORM for user identity and session persistence. We needed to choose between a synchronous native C++ driver (`better-sqlite3`) and an HTTP/WebSocket/embedded client (`@libsql/client`).

## Decision
We chose `@libsql/client` pointing to a local SQLite file in development/testing (`file:local.db`) and compatible with in-memory execution (`:memory:`).

## Consequences
- No native compilation (`node-gyp`) or platform-specific binary rebuilds required.
- Full compatibility with Next.js App Router server runtimes, serverless deployment targets, and cloud SQLite (Turso) without database schema changes.
- Requires asynchronous database queries across all Drizzle interactions.
