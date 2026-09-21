# Verifit Product Shell and Landing Architecture

## Context
The application needs a user-facing entry point explaining its core value proposition (an intelligent CV tailoring web application powered by Sanity CMS) and routing users into registration, login, and account management.

## Decision
We implement a modern landing page at `/` featuring product highlights, CV tailoring workflows, Sanity integration highlights, dynamic navigation states (reflecting active authentication), and direct access to `/login`, `/register`, and `/account`.

## Consequences
- Immediate clarity for visitors and testing anchors for Playwright E2E suites.
- Dynamic global navigation provides transparent state reflection when logging in or out.
