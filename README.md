# Verifit — Intelligent CV Tailoring & Requirement Matching

Verifit is an intelligent CV tailoring and requirement matching platform built with **Next.js 16 App Router**, **React 19**, **Sanity CMS**, and **Tailwind CSS v4**. It combines local relational persistence for authentication with a headless Sanity CMS content repository and **Sanity Agent Actions** for AI-driven CV extraction, Job Description (JD) structuring, and grounded, quote-validated candidate requirement matching.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [1. Authentication & Identity Management](#1-authentication--identity-management)
  - [2. Core UI & Design System](#2-core-ui--design-system)
  - [3. CV Management & Modular Editor](#3-cv-management--modular-editor)
  - [4. Job Description (JD) Intelligence](#4-job-description-jd-intelligence)
  - [5. Grounded CV–JD Matching & Scoring Engine](#5-grounded-cvjd-matching--scoring-engine)
  - [6. Embedded Sanity Studio](#6-embedded-sanity-studio)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites & Getting Started](#prerequisites--getting-started)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Setup & Migrations](#database-setup--migrations)
- [Sanity CMS & AI Agent Actions Setup](#sanity-cms--ai-agent-actions-setup)
- [User Guide & Application Workflows](#user-guide--application-workflows)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Deployment](#production-deployment)

---

## Overview

Verifit bridges candidate resumes and employer job descriptions with transparent, verifiable intelligence. Instead of treating resume matching as an opaque score, Verifit decomposes job postings into granular, hierarchical requirements (skills, experience ranges, degrees, certifications, AND/OR alternative groupings), extracts candidate career histories into structured modular sections, and scores CVs using a deterministic, weighted rubric grounded in exact, verifiable quotes from the candidate's resume.

---

## Key Features

### 1. Authentication & Identity Management (`modules/auth`)
- **Secure Email & Password Authentication**: Instant session issuance, credential hashing, and role support (`user`, `admin`) powered by **Better Auth**.
- **Two-Tier Route Protection**: Next.js Edge Middleware interception combined with server-side `requireUser()` utilities.
- **Self-Service Account Center**: Accessible at `/account` to update display names, avatar URLs, passwords, inspect and revoke active sessions across multiple devices, or permanently delete the account.
- **Relational Persistence**: Users, sessions, accounts, and verification tokens stored in SQLite / LibSQL with strict relational integrity.

### 2. Core UI & Design System (`modules/core`)
- **Modern Aesthetic**: Built on Tailwind CSS v4 with custom dark mode-friendly palette, smooth transitions, and glassmorphism elements.
- **Reusable Component Primitives**: Pre-built Status Badges, Stat Cards, Empty States, Copy Buttons, and Alert Callouts.
- **Responsive Layouts**: Collapsible mobile navigation, global header with live session state, and accessible modal dialogs.

### 3. CV Management & Modular Editor (`modules/cvs`)
- **Multi-Source Ingestion**:
  - **File Uploads**: Supports PDF (`unpdf`), Microsoft Word DOCX (`mammoth`), and Markdown/Plain Text files.
  - **Direct Text Input**: Paste raw resume text directly into the importer.
- **AI-Powered Structured Extraction**: Sanity Agent Actions transforms raw unstructured CV text into typed Sanity documents:
  - Personal Information & Summary
  - Work Experience & Projects
  - Education & Certifications
  - Skills & Language Proficiencies
  - Custom Modular Sections
- **In-Place Modular Section Editor** (`/cvs/[id]`):
  - Add, edit, remove, and reorder modular resume sections.
  - Granular validation powered by Zod schemas.
  - Optimistic updates with Sanity revision precondition checks (`_rev`) to avoid edit collisions.
- **CV Dashboard** (`/cvs`): Filter, search, inspect ingestion status, and trigger automatic or manual reprocessing.

### 4. Job Description (JD) Intelligence (`modules/jds`)
- **Flexible Ingestion**:
  - **Live URL Scraping**: High-fidelity job page extraction via `@mozilla/readability` and `jsdom`, fortified with SSRF prevention (IP pinning and private subnet blocking via `ipaddr.js`).
  - **Document & Text Upload**: Support for PDF, DOCX, and raw text postings.
- **Hierarchical Requirement Structuring**:
  - Automatically identifies role title, company, experience levels, responsibilities, and salary data.
  - Builds complex requirement trees with support for `AND` / `OR` alternative groups (e.g., "Degree in CS OR 4+ years of relevant experience").
  - Identifies min/max experience requirements and nested qualifications.
- **Interactive Review & Confirmation Workflow**:
  - Multi-step progression: `Draft` &rarr; `Needs Review` &rarr; `Confirmed`.
  - Side-by-side claim support verification against original source text.
  - Atomic pending replacement workflow: Re-ingest an updated posting without losing the current confirmed version until explicitly accepted.

### 5. Grounded CV–JD Matching & Scoring Engine (`modules/matching`)
- **Deterministic Rubric (`requirements-v1`)**:
  - Weights: Required = 3 pts, Unspecified Importance = 2 pts, Preferred = 1 pt.
  - Fulfillment: Met = 100%, Partial = 50%, Not Evidenced / Mismatch = 0%.
  - Handles nested experience hierarchies without double-counting years.
  - Resolves boolean alternative groups (`OR` takes the highest child score).
- **Zero-Hallucination Evidence Grounding**:
  - Employs Sanity Agent Actions to assess requirement coverage with zero writes (`noWrite: true`).
  - Application layer rigorously verifies that every quoted claim exists verbatim in the active CV section before accepting evidence.
- **Resilient Background Processing**:
  - Background evaluation orchestrated via Next.js `after()`.
  - 5-minute revision-checked distributed lease prevents duplicate concurrent workers across browser tabs.
  - Concurrency limited to two CV assessments per batch.
  - Document-level cache fingerprinting: display edits (like renaming a CV) do not invalidate calculated scores, while material changes immediately flag matches as pending.
- **Interactive Matches Panel** (`/jds/[id]`):
  - Ranked CV leaderboard with percentage coverage scores.
  - Explicit requirement gap analysis highlighting unmet criteria.
  - Collapsible requirement cards with exact quoted proof and direct jump-links to the corresponding CV section.

### 6. Embedded Sanity Studio (`/studio`)
- Native Sanity Studio v5 mounted directly within the Next.js App Router at `/studio`.
- Real-time GROQ query inspection via the Sanity Vision tool.
- Content schema models for `cvDocument`, `jobDescription`, and `cvMatch`.

---

## Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Actions, `after()`) + [React 19](https://react.dev) | High-performance full-stack web application framework |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com), [Lucide React](https://lucide.dev) | Utility-first styling, icons, and modern responsive design system |
| **Authentication** | [Better Auth](https://www.better-auth.com) (with Admin plugin) | Secure session management, password hashing, and user identity |
| **Database & ORM** | [LibSQL](https://github.com/tursodatabase/libsql-client-ts) (SQLite) + [Drizzle ORM](https://orm.drizzle.team) | Relational user database with schema migrations via Drizzle Kit |
| **Headless CMS** | [Sanity Studio v5](https://www.sanity.io) (`next-sanity`, `@sanity/vision`) | Real-time content lake, document revisioning, GROQ querying |
| **AI Agent Actions** | Sanity Agent Actions (`@sanity/client` API `vX`) | Schema-constrained document structuring, support review, and candidate match assessment |
| **Document Parsing** | [unpdf](https://github.com/unjs/unpdf), [mammoth](https://github.com/mwilliamson/mammoth.js) | Native parsing of PDF and Microsoft Word DOCX files |
| **Web Extraction** | [@mozilla/readability](https://github.com/mozilla/readability), [jsdom](https://github.com/jsdom/jsdom), [ipaddr.js](https://github.com/whitequark/ipaddr.js) | SSRF-safe URL scraping and clean article text extraction |
| **Validation** | [Zod](https://zod.dev) | Runtime schema validation across API payloads, forms, and AI outputs |
| **Testing** | [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com), [Playwright](https://playwright.dev) | Unit, DOM, integration, and cross-browser end-to-end testing |

---

## Project Architecture

The application adopts a **root-level modular architecture** ([ADR 0002](file:///Users/saad/Projects/offereveryday/Verifit/docs/adr/0002-root-modular-architecture.md)), encapsulating business domains into self-contained modules while Next.js routes handle presentation and HTTP endpoints:

```
verifit/
├── app/                           # Next.js 16 App Router routes
│   ├── account/                   # Account management dashboard
│   ├── api/                       # API Route Handlers
│   │   ├── auth/[...all]/         # Better Auth catch-all handler
│   │   ├── cvs/                   # CV import, detail, update, retry endpoints
│   │   └── jds/                   # JD import, actions, and matching endpoints
│   ├── cvs/                       # CV dashboard, upload, and detail/editor pages
│   ├── jds/                       # JD dashboard, upload, review, and matches pages
│   ├── login/ & register/         # Authentication view pages
│   ├── studio/                    # Embedded Sanity Studio route
│   ├── layout.tsx                 # Root layout with responsive Global Header
│   └── page.tsx                   # Product landing page
├── components/                    # Global presentation components
├── db/                            # Relational Database layer
│   ├── schema/                    # Drizzle ORM schemas (users, sessions, auth tables)
│   ├── index.ts                   # LibSQL client & Drizzle db instance
│   └── migrate.ts                 # Programmatic migration runner
├── drizzle/                       # Generated SQL migration files & snapshot metadata
├── modules/                       # Autonomous Domain Modules
│   ├── auth/                      # Authentication, sessions, user guards, Better Auth server/client
│   ├── core/                      # Design tokens, badges, cards, buttons, styles
│   ├── cvs/                       # CV schemas, parser, service, agent actions, modular editor
│   ├── jds/                       # JD schemas, web scraper, SSRF protection, review stepper
│   └── matching/                  # Rubric scoring engine, lease scheduler, matching panel
├── sanity/                        # Sanity CMS Studio configuration
│   ├── lib/                       # Sanity clients (server-client, agent-client, mock-client)
│   └── schemaTypes/               # Studio schema definitions (CV, JD, Matching types)
├── tests/
│   ├── e2e/                       # Playwright browser end-to-end specs
│   └── unit/                      # Vitest unit, API, scoring, and component tests
└── middleware.ts                  # Edge session guard for protected routes
```

---

## Prerequisites & Getting Started

### 1. Prerequisites

- **Node.js**: `v20.x` or later (tested on Node `v22` and `v25`)
- **npm**: `v10.x` or later
- **Sanity Account**: A Sanity project (free tier is sufficient) with Agent Actions enabled.

### 2. Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/your-org/verifit.git
cd verifit
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Copy the template configuration to create your local `.env.local`:

```bash
cp .env.template .env.local
```

Open `.env.local` and populate the required keys (see [Environment Variables Reference](#environment-variables-reference) below).

### 4. Database Setup & Migrations

Run the programmatic database migration script to generate your local SQLite database:

```bash
npm run db:migrate
```

*This applies all versioned SQL migrations from `drizzle/` into `file:local.db`.*

### 5. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public base URL of the web application | `http://localhost:3000` |
| `BETTER_AUTH_URL` | Base URL used by Better Auth for callback resolution | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | 32+ character random secret string for session signing | `openssl rand -hex 32` |
| `DATABASE_URL` | LibSQL connection URI (local SQLite file or Turso URL) | `file:local.db` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity Project ID | Obtained from [sanity.io/manage](https://www.sanity.io/manage) |
| `NEXT_PUBLIC_SANITY_DATASET` | Target Sanity dataset | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION`| Sanity API version date string | `2026-09-19` |
| `SANITY_API_TOKEN` | Sanity Write Token (Editor/Write permission) | Server-only secret token |
| `SANITY_AGENT_SCHEMA_ID` | Deployed Sanity Schema ID for CV extraction | Output of `npx sanity schemas list` |
| `SANITY_JD_AGENT_SCHEMA_ID` | Deployed Sanity Schema ID for JD structuring | Output of `npx sanity schemas list` |
| `SANITY_MATCH_AGENT_SCHEMA_ID` | Deployed Sanity Schema ID for Matching assessment | Output of `npx sanity schemas list` |
| `MOCK_SANITY` | Set to `true` to use the in-memory mock client offline | `false` (default) |

> [!IMPORTANT]
> **Keep your Sanity dataset private.** The application enforces per-user tenant isolation on every read and write. Client browsers never receive the server-side Sanity write token. A public dataset bypasses application boundary protection.

---

## Database Setup & Migrations

Verifit uses **Drizzle ORM** configured over **LibSQL** (SQLite). The database stores user identities, authentication credentials, active device sessions, and account profiles.

### Running Migrations
To apply all pending migrations in `drizzle/` to your database (`file:local.db`):
```bash
npm run db:migrate
```

### Modifying the Database Schema
1. Edit the schema definitions in [`db/schema/auth.ts`](file:///Users/saad/Projects/offereveryday/Verifit/db/schema/auth.ts).
2. Generate the next migration SQL files:
   ```bash
   npm run db:generate
   ```
3. Apply the generated migration:
   ```bash
   npm run db:migrate
   ```

---

## Sanity CMS & AI Agent Actions Setup

Verifit utilizes Sanity as both a headless CMS and an AI extraction engine via **Sanity Agent Actions**.

### 1. Initialize Sanity Project & Token
1. Create a project at [Sanity Manage](https://www.sanity.io/manage).
2. Create a dataset named `production` with **Private** visibility.
3. Under **API** &rarr; **Tokens**, generate a new token with **Editor** (Write) permissions.
4. Copy the token into `SANITY_API_TOKEN` in `.env.local`.

### 2. Deploy Schemas for Agent Actions
Sanity Agent Actions requires schema deployment to the Sanity cloud so that the AI model operates with strict schema enforcement.

1. **Deploy Core Studio & Extraction Schemas**:
   ```bash
   npx sanity schemas deploy
   ```
2. **Deploy Tagged Matching Assessment Schema**:
   Matching assessments utilize dedicated evaluation schemas. Deploy with the matching tag:
   ```bash
   npx sanity schemas deploy --tag matching-v1
   ```
3. **Retrieve Schema IDs**:
   List your deployed schemas:
   ```bash
   npx sanity schemas list
   ```
4. **Update `.env.local`**:
   - Set `SANITY_AGENT_SCHEMA_ID` to the schema ID containing `cv`.
   - Set `SANITY_JD_AGENT_SCHEMA_ID` to the schema ID containing `jdGeneration` and `jdSupport`.
   - Set `SANITY_MATCH_AGENT_SCHEMA_ID` to the schema ID containing `matchAssessment`.
5. Restart your application server.

---

## User Guide & Application Workflows

### 1. Sign Up and Manage Account
1. Open [http://localhost:3000/register](http://localhost:3000/register) to create a new user account.
2. Visit [http://localhost:3000/account](http://localhost:3000/account) to update your profile name, change passwords, inspect active sessions across browsers, or revoke other devices.

### 2. Import and Edit a CV
1. Navigate to **CVs** (`/cvs`) and click **Import CV**.
2. Upload a PDF, DOCX, or text file (or paste raw text).
3. The background worker parses the document and invokes Sanity Agent Actions to extract structured sections.
4. Click on the imported CV to open the **Interactive Modular Editor** (`/cvs/[id]`):
   - Edit personal details, executive summary, and contact information.
   - Add, edit, or delete work experience roles, degrees, certifications, skills, and custom sections.
   - Save changes with automatic optimistic updates and revision collision protection.

### 3. Import and Confirm a Job Description (JD)
1. Navigate to **Jobs** (`/jds`) and click **Add Job Description**.
2. Choose your input source:
   - **Fetch from URL**: Paste any public job posting URL (e.g. LinkedIn, Greenhouse, Lever). Built-in SSRF protection blocks private network requests.
   - **Upload File**: Upload a PDF, DOCX, or text file.
   - **Paste Text**: Directly paste the text of the job posting.
3. The AI agent extracts role details, responsibilities, benefits, and hierarchical requirement trees (with AND/OR groups and years-of-experience ranges).
4. Review the extracted claims against the original source text. Click **Confirm Requirements** to publish the JD.

### 4. Evaluate CV–JD Matches
1. Open any confirmed Job Description at `/jds/[id]`.
2. Scroll to the **CV Matches** panel.
3. The matching engine automatically evaluates your CVs in the background using the deterministic `requirements-v1` rubric.
4. Expand any candidate card to view:
   - **Match Percentage Score**: Calculated strictly from fulfilled requirement weights.
   - **Requirement Breakdown**: Individual requirements tagged as Met, Partial, or Missing.
   - **Exact Quoted Evidence**: Verified citations extracted verbatim from the CV with direct anchor links to the relevant CV section.
   - **Unmet Gaps**: Explicit list of missing qualifications to assist in resume tailoring.
   - **Retry Assessment**: One-click re-evaluation if a CV was recently updated.

### 5. Access Sanity Studio
Navigate to [http://localhost:3000/studio](http://localhost:3000/studio) to inspect your raw content documents (`cv`, `jobDescription`, `cvMatch`) or execute custom GROQ queries via the Vision tool.

---

## Testing & Quality Assurance

Verifit is supported by a comprehensive automated test suite spanning unit, component, API, and end-to-end browser tests.

```bash
# Run all unit and integration tests (Vitest)
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run end-to-end browser tests (Playwright)
npm run test:e2e

# Run TypeScript type-checking
npx tsc --noEmit

# Run ESLint validation
npm run lint
```

### Test Coverage Highlights
- **Auth & Session Guard**: Tests password hashing, session issuance, multi-device revocation, and middleware redirection.
- **Document Parsers**: Validates text extraction across PDF buffers, DOCX streams, and malformed files.
- **SSRF Defense**: Tests IP pinning, DNS rebinding guards, private IPv4/IPv6 ranges (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`, etc.).
- **Scoring Engine**: 17+ deterministic tests verifying weight calculations, nested `OR` alternatives, capped experience years, and quote provenance verification.
- **Concurrency & Leases**: Validates distributed lease locks, 5-minute timeout recovery, and multi-tenant isolation.

---

## Production Deployment

### 1. Build and Run Production Server
```bash
npm run build
npm run start
```

### 2. Production Checklist
- **Database**: When deploying to serverless environments (e.g. Vercel), switch `DATABASE_URL` to a hosted [Turso](https://turso.tech) LibSQL database (`libsql://your-db.turso.io`) and set `DATABASE_AUTH_TOKEN`.
- **Function Timeout**: Ensure your hosting platform allows at least **300 seconds** for background route execution (`after()`) during AI Agent Actions generation.
- **Sanity Security**: Ensure your Sanity dataset is private and never expose `SANITY_API_TOKEN` to the browser.
