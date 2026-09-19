# 05: Self-Service Account Management Dashboard

**What to build:** A comprehensive `/account` dashboard where authenticated users can view and update their profile details (display name and avatar image), update their password, view all currently active sessions (with device/browser information and active indicators), revoke other active sessions, and delete their account with explicit confirmation.

**Blocked by:** 04: User Authentication, Route Protection & Sign Out

**Status:** ready-for-agent

- [ ] `/account` protected route with server component `requireUser()` prefetching session data
- [ ] Profile management tab allowing updates to display name and avatar URL
- [ ] Security tab for changing password with current password verification
- [ ] Active sessions tab rendering all open sessions with the ability to revoke individual remote sessions
- [ ] Danger zone section with a confirmation modal to permanently delete the account
- [ ] Vitest component tests verifying account settings interactions and validation states
