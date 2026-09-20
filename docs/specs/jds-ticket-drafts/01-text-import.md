# 01: Import pasted text into a private JD library

**What to build:** Paste one job ad, follow its processing, and inspect the saved Structured JD and JD Source in a private library.

**Blocked by:** None (can start immediately)

**Status:** draft — awaiting breakdown approval and tracker configuration

- [ ] Provide library navigation, an empty state, text submission, progress, and a detail view; reopening an import preserves its status.
- [ ] Persist User-owned JDs in Sanity independently of CVs; enforce authenticated ownership for every read and mutation and never expose another User’s documents.
- [ ] Reject blank input and input above 50,000 characters without truncation; accept exactly 50,000 characters.
- [ ] Use the existing agent client with generation without automatic writes, validate output, and persist only permitted content fields; generation cannot change ownership or readiness.
- [ ] Capture title, company, responsibilities, seniority, skills, experience, education, certifications, languages, location, work arrangement, employment type, compensation, and explicit eligibility constraints.
- [ ] Preserve required/preferred/unspecified classifications, supporting excerpts, alternatives, overlapping experience durations, and source language; leave unstated fields empty.
- [ ] Accept recognizable incomplete descriptions with warnings; reject unrelated content and request one ad when multiple jobs are detected.
- [ ] Save valid output as needs review, never ready; retain source and show actionable errors on failure.
- [ ] Prove import, persisted content, validation, privacy, input assessment, and malformed agent response behavior through API integration tests with external dependencies substituted.

Each slice includes the necessary data model, server operations, UI, and behavioral tests. Follow the existing domain vocabulary, modular architecture, and identity/content storage boundary. API-focused testing with limited UI interaction tests remains proposed pending confirmation.
