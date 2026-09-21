# Spec: Authentication, Account Management & Test Harness

## Problem Statement

Users of Verifit currently have no way to register, authenticate, or manage personal profiles and sessions. Without an identity layer, personalized CV tailoring, persistent CV generation histories, and secure user-specific workflows cannot exist. Additionally, the project lacks automated testing infrastructure (unit, integration, and E2E) to safeguard regressions as the application scales.

## Solution

Implement an encapsulated, modular authentication and account management system powered by Better Auth and Drizzle ORM over LibSQL/SQLite. Deliver a modern CV-tailoring landing page with authenticated navigation states, secure sign-up and sign-in workflows, self-service account management (profile updates, password changes, active session revocation, and account deletion), robust middleware protection for private routes, and comprehensive automated test suites using Vitest and Playwright.

## User Stories

1. As a visitor, I want to view a landing page detailing Verifit's tailoring capabilities, so that I understand the product value before creating an account.
2. As a visitor, I want clear links to sign in and register in the global navigation, so that I can easily enter the authentication flow.
3. As a visitor, I want to register for an account using my name, email address, and a secure password, so that I can establish my user identity.
4. As a visitor, I want clear validation feedback if I enter an invalid email or an insufficiently secure password during registration, so that I can correct input mistakes immediately.
5. As a registered user, I want my session to be established immediately upon successful registration, so that I can start using the application without manual confirmation friction.
6. As a registered user, I want to sign in using my email and password, so that I can regain access to my account across devices.
7. As a registered user, I want clear, friendly error messages when entering incorrect credentials, so that I know why my login attempt failed.
8. As a registered user, I want to be redirected back to my intended page after logging in if I attempted to access a protected URL, so that my navigation context is preserved.
9. As an authenticated user, I want to see my display name and avatar status in the global navigation bar, so that I know I am actively logged in.
10. As an authenticated user, I want to access a dedicated account settings dashboard, so that I can manage my personal information and credentials.
11. As an authenticated user, I want to update my display name and avatar URL, so that my account profile reflects my personal branding on generated CVs.
12. As an authenticated user, I want to update my password by providing my current password and new password, so that I can maintain account security.
13. As an authenticated user, I want to inspect a list of my active sessions (including device/browser details and activity timestamps), so that I can verify account access across my hardware.
14. As an authenticated user, I want to revoke individual active sessions on other devices, so that I can terminate unauthorized or outdated logins.
15. As an authenticated user, I want to securely delete my account and associated data after confirmation, so that I maintain complete privacy and control over my identity.
16. As an authenticated user, I want to sign out of my current session with a single click, so that others using the shared device cannot access my account.
17. As an unauthenticated visitor, I want attempts to access private routes like `/account` to be safely intercepted and redirected to `/login`, so that private user data is never exposed.
18. As an administrator, I want my account to hold an administrative role, so that privileged management capabilities can be exercised securely in the future.
19. As a developer, I want all database migrations to be deterministic and version-controlled, so that database structures stay synchronized across environments.
20. As a developer, I want automated unit and integration tests executing against an in-memory database, so that logic regressions are caught rapidly during local development.
21. As a developer, I want automated end-to-end browser tests testing full user registration, login, profile updates, and logout, so that user journeys are guaranteed to work in real browsers.

## Implementation Decisions

- **Modular Architecture**: Application concerns are isolated into independent modules. Identity and authentication live in an autonomous auth module, separated from database connection infrastructure and presentation route handlers.
- **Database Engine & Driver**: LibSQL client (`@libsql/client`) paired with Drizzle ORM. Configured for local file storage in development (`file:local.db`), in-memory execution for fast unit tests (`:memory:`), and isolated file execution for E2E runs (`file:test.db`).
- **Schema Management & Versioning**: Versioned SQL migrations generated via Drizzle Kit into a dedicated migrations directory, paired with an automated programmatic migration runner on server and test initialization.
- **Authentication Engine**: Better Auth handles session cookies, credential hashing, session lifecycles, and user identity tables.
- **Role-Based Access Control**: Better Auth's official `admin` plugin is activated, establishing canonical roles (`user`, `admin`) directly in the user schema.
- **Account Management Capabilities**: Full self-service capabilities: profile information updates, password modifications, active multi-session listing and targeted revocation, and account deletion.
- **Multi-Layer Route Protection**: Next.js middleware enforces path-based redirection to the login screen for unauthenticated visitors, while server component utilities provide type-safe user session access within page layouts.
- **Decoupled CMS Boundary**: Sanity Studio retains independent authentication and content authoring mechanisms, isolated from the SQLite application identity store.
- **Product Landing Page**: The root page is converted into a modern CV-tailoring product showcase emphasizing Sanity CMS integration, feature capabilities, and clear authentication entry points.

## Testing Decisions

- **Test Quality Standard**: Tests must verify observable external behavior (HTTP contracts, user-visible DOM interactions, session persistence, database state changes) rather than private implementation details.
- **Testing Seams**:
  - *Primary E2E Seam*: Playwright browser automation interacting with the full Next.js application, testing actual HTTP transactions, cookie persistence, page transitions, and local database mutations against an isolated test database.
  - *Secondary Integration Seam*: Vitest running against an in-memory LibSQL database (`:memory:`), testing Better Auth server actions, API responses, and Drizzle models.
  - *UI Component Seam*: Vitest paired with a lightweight DOM environment (`happy-dom`) and React Testing Library to validate form states, client-side validation rules, and error banner notifications.
- **Test Isolation**: Every test run spins up a clean, isolated schema via programmatic migrations. Playwright uses a dedicated test port and dedicated SQLite database that is wiped clean before test execution.

## Out of Scope

- External OAuth / Social login providers (Google, GitHub) are deferred to a follow-up iteration.
- Mandatory email verification gating via third-party SMTP/email delivery APIs (registration grants immediate session access).
- Multi-factor authentication (TOTP/SMS/WebAuthn).
- Sanity Studio role-gating or syncing application users into Sanity document types.
- CV authoring, editing, and tailoring generation engines (covered in subsequent domain modules).

## Further Notes

- The project uses Next.js 16 App Router and React 19.
- Styling adheres to Tailwind CSS v4 using modern design patterns, accessible color contrasts, and responsive layouts.
- No issue tracker or triage vocabulary was configured in the repository; the specification is committed directly to the project documentation.
