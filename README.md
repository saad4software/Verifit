# SanityCV — Intelligent CV Tailoring Web Application

SanityCV is an intelligent CV tailoring platform built with **Next.js 16 App Router**, **React 19**, **Sanity CMS**, and **Tailwind CSS v4**. It features an encapsulated authentication and account management layer powered by **Better Auth** and **Drizzle ORM** over **LibSQL/SQLite**, backed by comprehensive **Vitest** and **Playwright** test suites.

---

## Features

- **CV Tailoring Proposition**: Modern landing page at `/` articulating role-targeted resume generation.
- **Headless Sanity CMS**: Built-in Sanity Studio at `/studio` for structured career history management (skills, experiences, education).
- **Authentication & Identity**: Email & password authentication with instant session establishment, credential hashing, and role support (`user`, `admin`) via Better Auth.
- **Multi-Layer Route Protection**: Two-tier session guard utilizing Next.js middleware edge interception and server component `requireUser()` utilities.
- **Self-Service Account Management**: User dashboard at `/account` for editing display names and avatar URLs, changing passwords, inspecting and revoking active sessions across devices, and account deletion.
- **Type-Safe Validation**: Form input validation powered by **Zod** across all authentication and profile forms.
- **Local Relational Persistence**: Zero-configuration LibSQL SQLite client (`file:local.db`) with deterministic, versioned SQL migrations managed by Drizzle Kit.
- **Full Test Harness**: Unit and integration tests running against in-memory SQLite (`:memory:`) with Vitest, and end-to-end browser journeys with Playwright against an isolated test database.

---

## Tech Stack

| Area | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) + [React 19](https://react.dev) |
| **CMS** | [Sanity Studio v5](https://www.sanity.io) (`next-sanity`) |
| **Authentication** | [Better Auth](https://www.better-auth.com) with official `admin` plugin |
| **Database & ORM** | [LibSQL Client](https://github.com/tursodatabase/libsql-client-ts) + [Drizzle ORM](https://orm.drizzle.team) |
| **Form Validation** | [Zod](https://zod.dev) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + [Lucide React Icons](https://lucide.dev) |
| **Testing** | [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com), [Playwright](https://playwright.dev) |

---

## Project Structure

Following the root-level modular architecture ([ADR 0002](file:///Users/saad/Projects/offereveryday/sanitycv/docs/adr/0002-root-modular-architecture.md)):

```
sanitycv/
├── app/                           # Next.js App Router presentation routes
│   ├── account/                   # Protected account management dashboard
│   ├── api/auth/[...all]/         # Better Auth API catch-all route handler
│   ├── login/                     # Sign-in page
│   ├── register/                  # Registration page
│   ├── studio/                    # Embedded Sanity Studio
│   ├── layout.tsx                 # Root layout with responsive Global Header
│   └── page.tsx                   # Product showcase landing page
├── components/                    # Shared global UI components (Header, etc.)
├── db/                            # Database connection & migration infrastructure
│   ├── schema/                    # Drizzle ORM schemas (auth tables, relations)
│   ├── index.ts                   # LibSQL client & Drizzle db instance
│   └── migrate.ts                 # Programmatic migration runner
├── drizzle/                       # Versioned SQL migration files & metadata
├── modules/
│   └── auth/                      # Autonomous Auth Domain Module
│       ├── components/            # LoginForm, RegisterForm, AccountDashboard
│       ├── client.ts              # Better Auth React client instance & hooks
│       ├── schemas.ts             # Centralized Zod validation schemas
│       ├── server.ts              # Better Auth server instance & admin plugin
│       └── session.ts             # Server requireUser() & session helpers
├── sanity/                        # Sanity CMS studio configuration and schemas
├── tests/
│   ├── e2e/                       # Playwright browser end-to-end journey specs
│   └── unit/                      # Vitest unit and DOM component tests
└── middleware.ts                  # Route protection interceptor for /account/*
```

---

## Getting Started

### 1. Prerequisites

- **Node.js**: `v20.x` or later (tested on Node v25)
- **npm**: `v10.x` or later

### 2. Installation

Clone the repository and install dependencies:

```bash
git checkout feat/auth-module
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Application & Auth URLs
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secure-secret-key-at-least-32-characters-long

# Database (defaults to file:local.db if omitted)
DATABASE_URL=file:local.db

# Sanity Studio
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

### 4. Database Setup & Migrations

Run the programmatic migration runner to create the SQLite database and apply versioned migrations:

```bash
npm run db:migrate
```

*This applies all migrations from `drizzle/` into `file:local.db`.*

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Sign In**: [http://localhost:3000/login](http://localhost:3000/login)
- **Register**: [http://localhost:3000/register](http://localhost:3000/register)
- **Account Dashboard** *(protected)*: [http://localhost:3000/account](http://localhost:3000/account)
- **Sanity Studio**: [http://localhost:3000/studio](http://localhost:3000/studio)

---

## Database Operations

- **Apply Migrations**:
  ```bash
  npm run db:migrate
  ```
- **Generate Migrations** (run after editing `db/schema/`):
  ```bash
  npm run db:generate
  ```

---

## Running Tests

### Unit & Integration Tests (Vitest)
Runs 37 automated tests verifying database persistence, in-memory migrations (`:memory:`), Zod schemas, form validations, and middleware guard logic:

```bash
npm run test
```

For interactive watch mode:
```bash
npm run test:watch
```

### End-to-End Tests (Playwright)
Executes browser journeys on an isolated test server (`port 3001`) with automatic database reset (`file:test.db`):

```bash
npm run test:e2e
```

### Type Checking & Linting
```bash
npx tsc --noEmit
npm run lint
```

---

## Production Build

To build and run the optimized production bundle:

```bash
npm run build
npm run start
```

## JD–CV matching

Every confirmed JD has a **CV matches** panel. CVs are ranked by documented
requirement coverage; expand a result to see its arithmetic, required gaps,
original JD excerpts, and validated quotes linked to the current CV sections.

### Enable matching

1. Use the existing authenticated Sanity write token and dataset.
2. Deploy the updated Studio schema with `npx sanity schemas deploy --tag matching-v1`.
3. Set `SANITY_MATCH_AGENT_SCHEMA_ID` in the server environment to the returned
   schema ID (also available through `npx sanity schemas list`).
4. Restart the app. Open a confirmed JD to assess existing CVs.

Keep the dataset private when storing personal CVs. The application enforces
ownership on every matching read and write; browser requests never receive the
Sanity token. A public dataset's direct API access is outside that application
boundary.

### Scoring rubric (requirements-v1)

- Required = 3 points, unspecified importance = 2, preferred = 1.
- Met earns 100% of the weight; partial earns 50%; not evidenced and explicit
  mismatch earn 0%. The final score is the rounded earned/possible percentage.
- No requirements means no numeric score.
- AND groups sum their members. OR groups use the best child's earned/possible
  ratio, weighted by the largest child's possible points. Alternatives are
  counted once. This also supports nested groups.
- Nested experience is assessed within its parent and its credit is capped by
  the parent's credit; nested years must never be added to total years.
- Required gaps are reported separately, respecting satisfied alternatives.
  Evidence coverage is the percentage of individual requirements with evidence,
  independent of scoring weights.
- Only the explicit requirement list is scored. Other JD fields provide context.
  A score is documented coverage, not a probability of success.

Sanity Agent Actions assesses each pair with one schema-constrained, no-write
generation request. Application code requires exactly one assessment per
requirement, checks that every quote occurs in its cited current CV field, and
calculates the score. Exact quote validation establishes provenance; it does
not prove that the model interpreted the quote correctly. Human review remains
necessary, especially for experience durations and ambiguous qualifications.

### Processing and caching

Results live in separate `cvMatch` documents, one per user/JD/CV pair.
Fingerprints include scoring version, matching schema ID, current JD content and
source text, and the CV fields assessed. Display-only changes such as renaming a
CV do not invalidate scores. Current employment is refreshed monthly for duration
calculations. Pending replacements do not replace the confirmed JD until accepted.

Confirming a JD, importing a CV, or saving CV edits schedules background matching.
A revision-checked, five-minute lease limits work to one worker per JD across
tabs/processes; each worker evaluates at most two CVs concurrently. Failed pairs
require the explicit retry button, while edited inputs automatically become
pending. Failed assessment attempts never produce a numeric score. Deleting a
source removes its saved match records; strong references prevent a late worker
from publishing a match for an already deleted source.

Work uses Next.js `after()` with a 300-second route limit and a bounded work
window. This is resumable background processing, not an external durable job
runner: a very large backlog or platform interruption may leave pending pairs
until the JD panel is opened again. The panel continues pending batches, recovers
expired leases, and polls for changes. For guaranteed unattended completion at
large scale, move the same lease/worker logic to a durable queue or scheduled
worker. Semantic embeddings are intentionally not required by this version.

Validation covers scoring, nested alternatives, fabricated evidence, ownership,
caching, concurrency, interrupted work, retry behavior, and the matching UI:
`npm test`, `npx tsc --noEmit`, and `npx sanity schemas validate`.
