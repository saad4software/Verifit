# Verifit — Intelligent CV Tailoring, Requirement Matching & Job Application Management

Verifit is an intelligent CV tailoring, requirement matching, and job application management platform built with **Next.js 16 App Router**, **React 19**, **Sanity CMS**, **Better Auth**, **LibSQL / Drizzle ORM**, and **Tailwind CSS v4**. It combines local relational persistence for identity and session management with a headless Sanity CMS content repository and **Sanity Agent Actions** for AI-driven CV extraction, Job Description (JD) structuring, grounded quote-validated requirement scoring, anti-hallucination CV tailoring, bespoke cover letter generation, and Kanban application tracking.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [1. Authentication, Identity & Session Proxy](#1-authentication-identity--session-proxy)
  - [2. Unified Dashboard & Core Design System](#2-unified-dashboard--core-design-system)
  - [3. CV Management & Modular Section Editor](#3-cv-management--modular-section-editor)
  - [4. Job Description (JD) Intelligence & Review Stepper](#4-job-description-jd-intelligence--review-stepper)
  - [5. Grounded CV–JD Matching & Deterministic Scoring Engine](#5-grounded-cvjd-matching--deterministic-scoring-engine)
  - [6. Job Application Pipeline, AI CV Tailoring & Cover Letters](#6-job-application-pipeline-ai-cv-tailoring--cover-letters)
  - [7. Embedded Sanity Studio](#7-embedded-sanity-studio)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites & Getting Started](#prerequisites--getting-started)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Setup & Migrations](#database-setup--migrations)
- [Sanity CMS & AI Agent Actions Setup](#sanity-cms--ai-agent-actions-setup)
- [User Guide & Application Workflows](#user-guide--application-workflows)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Continuous Integration (CI/CD) Pipeline](#continuous-integration-cicd-pipeline)
- [Production Deployment](#production-deployment)

---

## Overview

Verifit bridges candidate resumes and employer job descriptions with transparent, verifiable intelligence. Instead of treating resume tailoring as an opaque generation process or matching as an arbitrary score, Verifit:

1. **Decomposes Job Postings** into granular, hierarchical requirement trees (skills, experience ranges, degrees, certifications, and `AND`/`OR` alternative groupings).
2. **Extracts Candidate Resumes** into typed, modular sections that can be independently updated and audited.
3. **Scores Match Coverage Grounded in Evidence** using a deterministic, weighted rubric where every claim must be backed by exact, verbatim quotes from the candidate's CV.
4. **Tailors Specialized CV Variants** for target roles with strict anti-hallucination guardrails—re-framing achievements and highlighting matching skills without fabricating career history.
5. **Composes Bespoke Cover Letters** in multiple tones (`professional`, `conversational`, `executive`) grounded in verified candidate achievements.
6. **Manages the End-to-End Application Lifecycle** with an interactive Kanban board and application package drawer ready for job submission.

---

## Key Features

### 1. Authentication, Identity & Session Proxy (`modules/auth`, `proxy.ts`)
- **Secure Email & Password Authentication**: Instant session issuance, credential hashing, and user roles (`user`, `admin`) powered by **Better Auth**.
- **Next.js 16 Session Guard Proxy (`proxy.ts`)**: Fast edge-level route protection intercepting unauthenticated access to `/account` and `/dashboard` subroutes with automated `callbackUrl` redirects.
- **Server-Side Security**: Defense-in-depth enforcement via `requireUser()` utilities verifying session validity and tenant ownership across all server actions and API handlers.
- **Self-Service Account Center (`/account`)**: Manage profile names, update passwords, view active browser/device sessions with IP and user-agent metadata, revoke remote sessions individually, or delete the account with full cascade cleanup.
- **Relational Persistence**: Users, sessions, accounts, and verification tokens stored locally in SQLite via LibSQL with strict relational integrity.

### 2. Unified Dashboard & Core Design System (`modules/dashboard`, `modules/core`)
- **Dedicated Dashboard Layout (`/dashboard`)**: Central hub hosting CVs (`/dashboard/cvs`), Job Descriptions (`/dashboard/jds`), and Applications (`/dashboard/applications`).
- **Global Dashboard Header**: Persistent top navigation with active tab indication, live user session badge, fast links to Account settings, and secure sign-out.
- **Modern Tailored Aesthetic**: Engineered with Tailwind CSS v4 featuring a dark-mode-first aesthetic, sleek slate/indigo color palettes, smooth transitions, and glassmorphism backdrops.
- **Reusable Component Primitives**: Pre-built Status Badges, Stat Cards, Empty States, Copy-to-Clipboard Buttons, Modal Dialogs, and Notification Callouts.

### 3. CV Management & Modular Section Editor (`modules/cvs`)
- **Multi-Source Document Ingestion** (`/dashboard/cvs/import`):
  - **File Uploads**: Native parsing for PDF (`unpdf`), Microsoft Word DOCX (`mammoth`), and plain text/Markdown files.
  - **Direct Text Input**: Direct paste interface for raw CV text.
- **AI-Powered Structured Extraction**: Sanity Agent Actions parse raw text into typed Sanity schemas:
  - Personal Information & Executive Summary
  - Work Experience & Projects
  - Education & Certifications
  - Skills & Language Proficiencies
  - Custom Modular Sections
- **Interactive Modular Editor** (`/dashboard/cvs/[id]`):
  - Add, edit, remove, and reorder modular resume sections in real time.
  - Runtime validation powered by Zod schemas.
  - Optimistic updates backed by Sanity revision precondition checks (`_rev`) to eliminate concurrent edit collisions.
  - Designate a **Primary CV** to serve as the default baseline for future job applications.
- **Relational Integrity Protection**: Safe deletion checks prevent accidental removal of CVs linked to active job applications.

### 4. Job Description (JD) Intelligence & Review Stepper (`modules/jds`)
- **Multi-Source Job Ingestion** (`/dashboard/jds/import`):
  - **Live URL Scraping**: High-fidelity job page extraction via `@mozilla/readability` and `jsdom`.
  - **Hardened SSRF Defense**: Integrated IP pinning and private subnet blocking via `ipaddr.js` to thwart Server-Side Request Forgery and DNS rebinding attacks against internal networks (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`, IPv6 loopbacks, etc.).
  - **Document & Text Upload**: Support for PDF, DOCX, and raw text job postings.
- **Hierarchical Requirement Structuring**:
  - Automatically extracts role title, company, experience levels, responsibilities, and compensation data.
  - Structures complex requirement trees with support for `AND`/`OR` alternative groupings (e.g. *"Degree in CS OR 4+ years of equivalent practical experience"*).
  - Identifies min/max experience requirements and nested qualifications.
- **Interactive Review & Confirmation Workflow** (`/dashboard/jds/[id]`):
  - Multi-step review lifecycle: `Draft` &rarr; `Needs Review` &rarr; `Confirmed`.
  - Side-by-side claim support verification against original source text.
  - **Atomic Pending Replacement Workflow**: Re-scrape or re-ingest an updated job posting without overwriting the currently confirmed version until explicitly accepted.
  - Application dependency verification prevents deleting confirmed JDs associated with active applications.

### 5. Grounded CV–JD Matching & Deterministic Scoring Engine (`modules/matching`)
- **Deterministic Rubric (`requirements-v1`)**:
  - **Weights**: Required = 3 pts, Unspecified Importance = 2 pts, Preferred = 1 pt.
  - **Fulfillment**: Met = 100%, Partial = 50%, Not Evidenced / Mismatch = 0%.
  - Handles nested experience hierarchies without double-counting years.
  - Resolves boolean alternative groups (`OR` takes the highest child score).
- **Zero-Hallucination Evidence Grounding**:
  - Employs Sanity Agent Actions to assess requirement coverage with zero database writes (`noWrite: true`).
  - Application layer rigorously verifies that every cited quotation exists verbatim in the active CV text before accepting evidence.
- **Resilient Background Processing**:
  - Background evaluation orchestrated via Next.js `after()`.
  - 5-minute revision-checked distributed lease locks prevent duplicate concurrent evaluations across browser tabs.
  - Concurrency throttled to two CV assessments per batch.
  - Document-level cache fingerprinting: cosmetic edits (like renaming a CV) preserve computed scores, while substantive changes flag matches for recalculation.
- **Interactive Matches Panel** (`/dashboard/jds/[id]`):
  - Ranked CV leaderboard displaying match percentages and gap counts.
  - Expandable requirement cards with exact quoted proof and direct jump-links to the corresponding CV section.
  - One-click re-evaluation trigger to refresh scores after CV updates.

### 6. Job Application Pipeline, AI CV Tailoring & Cover Letters (`modules/applications`)
- **Application Pipeline Tracking** (`/dashboard/applications`):
  - Interactive **Kanban Board** and list views organizing applications across 5 recruitment stages: `Draft` &rarr; `Applied` &rarr; `Interviewing` &rarr; `Offered` &rarr; `Rejected`.
  - Drag-and-drop stage updates or quick-action dropdowns.
  - Real-time application creation linking any confirmed JD to a selected ready Base CV.
- **Anti-Hallucination AI CV Tailoring**:
  - Headless Sanity Agent Actions generate a tailored CV variant (`isTailored: true`) scoped directly to the target application.
  - Rewrites the professional summary to pitch the candidate directly for the role.
  - Re-aligns work experience bullet points to address unmet or partial JD requirements.
  - Re-prioritizes demonstrated skills matching the posting.
  - **Strict Anti-Hallucination Rules**: Prohibits fabricating past employers, job titles, dates, academic degrees, or certifications. All tailored points must be grounded in verified CV history.
- **Automated Re-Scoring & Requirement Delta Analysis** (`/dashboard/applications/[id]`):
  - Automatically runs the matching engine on the newly generated tailored CV.
  - **Score Delta Card**: Displays baseline vs. tailored match score, net percentage gain, and total gaps closed.
  - **Requirement Delta Table**: Row-by-row comparative analysis showing fulfillment progression (`not_evidenced` / `partial` &rarr; `met`) with highlighted improvement badges.
- **In-Place Tailored CV Modular Editing**:
  - The tailored CV can be refined directly in the modular section editor.
  - One-click **Re-score** action recalculates match metrics whenever manual edits are made.
- **Bespoke AI Cover Letter Generation**:
  - Generates tailored cover letters grounded in verified CV achievements and JD requirements.
  - Configurable stylistic tones: `professional` (polished & confident), `conversational` (warm & authentic), and `executive` (strategic & high-impact).
  - Integrates personalized user notes (e.g. referral names, relocation willingness, specific motivations).
  - Built-in Markdown editor for fine-tuning letter content.
- **Application Package Drawer**:
  - Unified slide-over drawer aggregating the tailored CV, cover letter, and external job link.
  - Fast one-click clipboard copying and export-ready document view for streamlined submission.
- **Cascade Deletion & Integrity**:
  - Cleanly cascades deletion of application-scoped tailored CVs and matches when an application is removed.

### 7. Embedded Sanity Studio (`/studio`)
- Native Sanity Studio v5 mounted directly within the Next.js App Router at `/studio`.
- Direct content inspection for `cv`, `jobDescription`, `cvMatch`, and `application` documents.
- Real-time GROQ query inspection via the Sanity Vision tool for administrative and debugging workflows.

---

## Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Actions, `proxy.ts`, `after()`) + [React 19](https://react.dev) | High-performance full-stack web application framework |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com), [Lucide React](https://lucide.dev) | Modern utility styling, responsive dark mode, icons, and design primitives |
| **Authentication** | [Better Auth](https://www.better-auth.com) (with Admin plugin) | Secure session cookies, credential hashing, and user identity management |
| **Database & ORM** | [LibSQL](https://github.com/tursodatabase/libsql-client-ts) (SQLite) + [Drizzle ORM](https://orm.drizzle.team) | Relational user identity database with versioned migrations via Drizzle Kit |
| **Headless CMS** | [Sanity Studio v5](https://www.sanity.io) (`next-sanity`, `@sanity/vision`) | Real-time content lake, document revisioning, GROQ querying |
| **AI Agent Actions** | Sanity Agent Actions (`@sanity/client` API `vX`) | Schema-constrained document structuring, support review, match assessment, and CV tailoring |
| **Document Parsing** | [unpdf](https://github.com/unjs/unpdf), [mammoth](https://github.com/mwilliamson/mammoth.js) | Native client parsing of PDF and Microsoft Word DOCX files |
| **Web Extraction** | [@mozilla/readability](https://github.com/mozilla/readability), [jsdom](https://github.com/jsdom/jsdom), [ipaddr.js](https://github.com/whitequark/ipaddr.js) | SSRF-safe URL scraping, clean article text extraction, IP pinning |
| **Validation** | [Zod](https://zod.dev) | Runtime schema validation across API payloads, forms, and AI outputs |
| **Testing** | [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com), [Playwright](https://playwright.dev) | 207+ unit, DOM, integration, and cross-browser end-to-end tests |

---

## Project Architecture

Verifit adheres to a **root-level modular architecture** ([ADR 0002](file:///Users/saad/Projects/offereveryday/Verifit/docs/adr/0002-root-modular-architecture.md)), encapsulating business domains into self-contained modules while Next.js routes handle presentation and HTTP endpoints:

```
verifit/
├── app/                           # Next.js 16 App Router routes
│   ├── account/                   # Account management dashboard
│   ├── api/                       # API Route Handlers
│   │   ├── applications/          # Application CRUD, tailoring, re-scoring, cover letter APIs
│   │   ├── auth/[...all]/         # Better Auth catch-all handler
│   │   ├── cvs/                   # CV import, detail, update, retry endpoints
│   │   └── jds/                   # JD import, actions, and matching endpoints
│   ├── dashboard/                 # Dedicated Dashboard layout and subroutes
│   │   ├── applications/          # Kanban board, list, and detail/tailoring pages
│   │   ├── cvs/                   # CV dashboard, upload, and modular editor pages
│   │   ├── jds/                   # JD dashboard, upload, review, and matches pages
│   │   ├── layout.tsx             # Protected dashboard layout with unified header
│   │   └── page.tsx               # Redirects to /dashboard/cvs
│   ├── login/ & register/         # Authentication view pages
│   ├── studio/                    # Embedded Sanity Studio route
│   ├── layout.tsx                 # Root application layout
│   └── page.tsx                   # Product marketing landing page
├── components/                    # Global presentation components
├── db/                            # Relational Database layer
│   ├── schema/                    # Drizzle ORM schemas (users, sessions, auth tables)
│   ├── index.ts                   # LibSQL client & Drizzle db instance
│   └── migrate.ts                 # Programmatic migration runner
├── drizzle/                       # Generated SQL migration files & snapshot metadata
├── modules/                       # Autonomous Domain Modules
│   ├── applications/              # Application lifecycle, Kanban, CV tailoring, cover letters
│   ├── auth/                      # Authentication, sessions, user guards, Better Auth server/client
│   ├── core/                      # Design tokens, badges, cards, buttons, styles
│   ├── cvs/                       # CV schemas, parser, service, agent actions, modular editor
│   ├── dashboard/                 # Dashboard layout components and navigation headers
│   ├── jds/                       # JD schemas, web scraper, SSRF protection, review stepper
│   └── matching/                  # Rubric scoring engine, lease scheduler, matching panel
├── sanity/                        # Sanity CMS Studio configuration
│   ├── lib/                       # Sanity clients (server-client, agent-client, mock-client)
│   └── schemaTypes/               # Studio schema definitions (CV, JD, Matching, Application)
├── tests/
│   ├── e2e/                       # Playwright browser end-to-end specs
│   └── unit/                      # Vitest unit, API, scoring, and component tests (26 test files)
└── proxy.ts                       # Next.js 16 session guard proxy for protected routes
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
| `DATABASE_URL` | LibSQL connection URI (local SQLite file fallback) | `file:local.db` |
| `TURSO_DATABASE_URL` | Hosted Turso database connection URL (`libsql://...`) | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso database authentication token | Secured database JWT token |
| `NEXT_PUBLIC_SANITY_DATASET` | Target Sanity dataset | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION`| Sanity API version date string | `2026-09-19` |
| `SANITY_API_TOKEN` | Sanity Write Token (Editor/Write permission) | Server-only secret token |
| `SANITY_AGENT_SCHEMA_ID` | Deployed Sanity Schema ID for CV extraction | Output of `npx sanity schemas list` |
| `SANITY_JD_AGENT_SCHEMA_ID` | Deployed Sanity Schema ID for JD structuring | Output of `npx sanity schemas list` |
| `SANITY_MATCH_AGENT_SCHEMA_ID` | Deployed Sanity Schema ID for Matching assessment | Output of `npx sanity schemas list` |
| `SANITY_APPLICATION_AGENT_SCHEMA_ID` | Deployed Sanity Schema ID for CV tailoring and cover letters | Output of `npx sanity schemas list` (falls back to `SANITY_AGENT_SCHEMA_ID`) |
| `MOCK_SANITY` | Set to `true` to use the in-memory mock client offline | `false` (default) |

> [!IMPORTANT]
> **Keep your Sanity dataset private.** The application enforces per-user tenant isolation on every read and write. Client browsers never receive the server-side Sanity write token. A public dataset bypasses application boundary protection.

---

## Database Setup & Migrations

Verifit uses **Drizzle ORM** configured over **LibSQL** (SQLite). The database stores user identities, authentication credentials, active device sessions, and account profiles.

### Running Migrations
To apply all pending migrations in `drizzle/` to your database (Turso when `TURSO_DATABASE_URL` is set, or local fallback `file:local.db`):
```bash
npm run db:migrate
```

### Migrating Data from Local SQLite to Turso
To copy existing local data (`file:local.db`) into your hosted Turso database:
```bash
npx tsx scripts/migrate-data-to-turso.ts
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

Verifit utilizes Sanity as both a headless CMS and an AI extraction/tailoring engine via **Sanity Agent Actions**.

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
   - Set `SANITY_APPLICATION_AGENT_SCHEMA_ID` to the schema ID containing `cv` and `applicationGeneration` (or leave empty to inherit `SANITY_AGENT_SCHEMA_ID`).
5. Restart your application server.

---

## User Guide & Application Workflows

### 1. Sign Up and Manage Account
1. Open [http://localhost:3000/register](http://localhost:3000/register) to create a new user account.
2. Sign in at [http://localhost:3000/login](http://localhost:3000/login).
3. Visit [http://localhost:3000/account](http://localhost:3000/account) to update your profile name, change passwords, inspect active sessions across browsers, or revoke other devices.

### 2. Access the Central Dashboard
1. Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
2. The unified dashboard header lets you switch seamlessly between **CVs**, **Job Descriptions**, and **Applications**.

### 3. Import and Edit a CV
1. Navigate to **CVs** (`/dashboard/cvs`) and click **Import CV**.
2. Upload a PDF, DOCX, or text file (or paste raw text).
3. The background worker parses the document and invokes Sanity Agent Actions to extract structured sections.
4. Click on the imported CV to open the **Interactive Modular Editor** (`/dashboard/cvs/[id]`):
   - Edit personal details, executive summary, and contact information.
   - Add, edit, or delete work experience roles, degrees, certifications, skills, and custom sections.
   - Save changes with automatic optimistic updates and revision collision protection.
   - Mark as **Primary CV** to establish your baseline profile.

### 4. Import and Confirm a Job Description (JD)
1. Navigate to **Job Descriptions** (`/dashboard/jds`) and click **Add Job Description**.
2. Choose your input source:
   - **Fetch from URL**: Paste any public job posting URL (e.g. LinkedIn, Greenhouse, Lever). Built-in SSRF protection blocks private network requests.
   - **Upload File**: Upload a PDF, DOCX, or text file.
   - **Paste Text**: Directly paste the text of the job posting.
3. The AI agent extracts role details, responsibilities, benefits, and hierarchical requirement trees (with `AND`/`OR` groups and years-of-experience ranges).
4. Review the extracted claims against the original source text. Click **Confirm Requirements** to publish the JD.

### 5. Evaluate CV–JD Matches
1. Open any confirmed Job Description at `/dashboard/jds/[id]`.
2. Scroll to the **CV Matches** panel.
3. The matching engine automatically evaluates your CVs in the background using the deterministic `requirements-v1` rubric.
4. Expand any candidate card to view:
   - **Match Percentage Score**: Calculated strictly from fulfilled requirement weights.
   - **Requirement Breakdown**: Individual requirements tagged as Met, Partial, or Missing.
   - **Exact Quoted Evidence**: Verified citations extracted verbatim from the CV with direct anchor links to the relevant CV section.
   - **Unmet Gaps**: Explicit list of missing qualifications to assist in resume tailoring.
   - **Retry Assessment**: One-click re-evaluation if a CV was recently updated.

### 6. Create Job Applications & Tailor CVs
1. Navigate to **Applications** (`/dashboard/applications`).
2. Click **New Application** and select a confirmed Job Description and a ready Base CV.
3. Once created, open the application details at `/dashboard/applications/[id]`.
4. Click **Tailor CV**:
   - The AI tailoring agent reframes your summary, highlights matching skills, and polishes work experience bullet points to address identified gaps without fabricating facts.
   - The matching engine automatically re-evaluates the tailored CV.
5. Inspect the **Score Delta Card** and **Requirement Delta Table** to see exactly how your score improved and which requirements moved to "Met".
6. If desired, open the tailored CV in the modular editor to make custom adjustments, then click **Re-score** to recalculate the metrics.

### 7. Generate Cover Letters & Assemble Application Package
1. On the application details page, navigate to the **Cover Letter** tab.
2. Select your desired tone (`Professional`, `Conversational`, or `Executive`) and optionally add notes (e.g. referral names or specific interests).
3. Click **Generate Cover Letter** to produce a personalized, fact-grounded letter. Edit the generated Markdown directly if needed.
4. Open the **Application Package Drawer** to inspect the complete bundle—tailored CV, cover letter, and external job link—and copy all materials to your clipboard in a single click.
5. Move the application across pipeline stages (`Applied` &rarr; `Interviewing` &rarr; `Offered`) directly on the **Kanban Board**.

### 8. Access Sanity Studio (Developers / Admins)
Navigate directly to [http://localhost:3000/studio](http://localhost:3000/studio) to inspect your raw content documents (`cv`, `jobDescription`, `cvMatch`, `application`) or execute custom GROQ queries via the Vision tool.

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

### Test Coverage Highlights (207+ Tests across 26 Test Files)
- **Auth & Session Guard**: Tests password hashing, session issuance, multi-device revocation, and `proxy.ts` edge redirection.
- **Document Parsers**: Validates text extraction across PDF buffers, DOCX streams, and malformed files.
- **SSRF Defense**: Tests IP pinning, DNS rebinding guards, and private IPv4/IPv6 address blocks (`127.0.0.1`, `10.0.0.0/8`, `169.254.169.254`, etc.).
- **Scoring Engine**: 17+ deterministic tests verifying weight calculations, nested `OR` alternatives, capped experience years, and quote provenance verification.
- **Concurrency & Leases**: Validates distributed lease locks, 5-minute timeout recovery, and multi-tenant isolation.
- **Applications & Tailoring**: Validates application CRUD, Kanban board workflows, score delta calculation, requirement delta mapping, anti-hallucination tailoring contracts, cover letter generation, and cascade deletion guards.

---

## Continuous Integration (CI/CD) Pipeline

Verifit uses **GitHub Actions** for automated continuous integration to ensure code health, test passing, and successful production builds on every pull request and push to the `main` branch.

The workflow is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and consists of two sequential phases:

1. **Test Phase (`test`)**:
   - Sets up Node.js 20 with cached npm dependencies.
   - Installs dependencies using clean install (`npm ci`).
   - Executes the complete test suite with Vitest (`npm test`, 210+ tests across 26 test files).
2. **Build Phase (`build`)**:
   - Restores Next.js Turbopack cache (`.next/cache`) to accelerate build times.
   - Injects environment configuration and safe CI fallbacks.
   - Runs `npm run build` to validate TypeScript compilation, route definitions, and page generation.

### Setting Up Required Data (GitHub Secrets & Variables)

To configure your GitHub repository for CI runs:

1. Open your repository on GitHub and navigate to:
   **Settings** &rarr; **Secrets and variables** &rarr; **Actions**
2. Click **New repository secret** and add the following:

| Secret Name | Required / Optional | Description | Default Fallback in CI |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | **Recommended** | Your Sanity CMS Project ID | Falls back to dummy ID for build verification |
| `NEXT_PUBLIC_SANITY_DATASET` | **Recommended** | Sanity dataset name (`production`) | `production` |
| `BETTER_AUTH_SECRET` | **Recommended** | 32+ character key for authentication | Generates 32-character test dummy secret |
| `SANITY_API_TOKEN` | Optional | Sanity API write token for runtime testing | Omitted during standard CI |

> **Note**: Standard build-time defaults (`DATABASE_URL=file:local.db`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, and `BETTER_AUTH_URL=http://localhost:3000`) are automatically configured within the CI runner, so builds and tests succeed out-of-the-box even before repository secrets are set.

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
- **Edge Proxy**: Ensure `proxy.ts` is deployed as part of your Next.js build to protect `/account` and `/dashboard` paths.
