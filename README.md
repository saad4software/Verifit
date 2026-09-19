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
