# 06: Playwright End-to-End Test Harness & User Journeys

**What to build:** An automated Playwright browser test suite configured to spin up an isolated test web server on port 3001 using a dedicated SQLite database (`file:test.db`). It executes complete end-to-end browser journeys covering landing page navigation, user registration, auto-login, account profile modification, session persistence, and logout.

**Blocked by:** 02: SanityCV Product Landing Page & Global Shell, 05: Self-Service Account Management Dashboard

**Status:** ready-for-agent

- [ ] Playwright configuration set up with webServer pointing to port 3001 and `DATABASE_URL=file:test.db`
- [ ] Automated database reset and migration execution prior to test suite runs
- [ ] E2E spec verifying visitor landing page discovery and navigation to registration
- [ ] E2E spec verifying registration, immediate session creation, and profile display in the header
- [ ] E2E spec verifying navigation to `/account`, display name update, and persistence across reloads
- [ ] E2E spec verifying sign-out and protected route interception redirecting to `/login`
