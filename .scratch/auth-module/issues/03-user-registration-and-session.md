# 03: User Registration & Immediate Session Establishment

**What to build:** The complete end-to-end user registration flow. A new visitor can navigate to `/register`, input their name, email, and password into a validated form, register an account via Better Auth, automatically receive an active session without email confirmation gating, and be immediately redirected into the application with their authenticated state reflected in the global navigation.

**Blocked by:** 01: Core Database, Auth Scaffolding & Migration Seam

**Status:** completed

- [x] `/register` page and `RegisterForm` component with accessible form fields and clear client validation
- [x] Better Auth API route handler mounted at `/api/auth/[...all]` handling credential registration
- [x] Immediate session creation upon valid registration without requiring email confirmation
- [x] Automatic client redirect to the destination URL upon success, with error banner handling for duplicate emails or invalid inputs
- [x] Vitest unit tests verifying form validation, submission behavior, and error alerts
