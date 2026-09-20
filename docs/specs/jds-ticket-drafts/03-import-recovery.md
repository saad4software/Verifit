# 03: Recover failed or interrupted imports

**What to build:** Retry failed initial processing from retained text and recover interrupted work without resubmitting the ad.

**Blocked by:** 01 — Import pasted text into a private JD library

**Status:** draft — awaiting breakdown approval and tracker configuration

- [ ] Expose retry and actionable errors in import detail/status views while preserving retained source.
- [ ] Retry uses retained text and does not fetch a URL; successful retry ends at needs review.
- [ ] Persist attempt identity and timing; interrupted attempts become retryable within a bounded interval visible through status polling or retry.
- [ ] Guard against duplicate active attempts and late completion overwriting a newer attempt or newer content.
- [ ] Failures in scheduling, agent generation, or validation remain recoverable and do not leave indefinite processing indicators.
- [ ] Use a controlled clock and background scheduler in API tests to prove interruption, retry, source retention, and stale-completion behavior without timing sleeps.

Each slice includes the necessary data model, server operations, UI, and behavioral tests. Follow the existing domain vocabulary, modular architecture, and identity/content storage boundary. API-focused testing with limited UI interaction tests remains proposed pending confirmation.
