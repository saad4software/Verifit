# 06: Review reprocessed and refreshed replacements

**What to build:** Reprocess retained text or explicitly refresh an ad URL, then accept or reject a proposed replacement without losing current reviewed work.

**Blocked by:** 02 — Review, correct, and confirm a JD; 03 — Recover failed or interrupted imports; 04 — Import a JD from a URL

**Status:** draft — awaiting breakdown approval and tracker configuration

- [ ] Expose distinct actions for reprocessing retained text and explicitly refetching the URL; reprocessing does not silently refresh online content.
- [ ] Retain current content/source and at most one pending replacement with its own source; further requests do not silently discard an unreviewed replacement.
- [ ] Current ready content remains ready and readable while replacement processing is pending, fails, or is rejected.
- [ ] Present proposed content and its source for correction and review using the same evidence checks as initial review.
- [ ] Acceptance atomically replaces source and content together and marks them ready; rejection preserves the current version.
- [ ] Guard acceptance against concurrent edits and stale processing; provide recoverable errors and preserve current work when replacement processing is interrupted.
- [ ] Preserve deletion behavior whenever deletion is available: a pending or late replacement cannot leave orphaned content or recreate a deleted JD.
- [ ] Test replacement acceptance, rejection, failure, source alignment, concurrency, and late completion through API behavior; test accept/reject review controls.

Each slice includes the necessary data model, server operations, UI, and behavioral tests. Follow the existing domain vocabulary, modular architecture, and identity/content storage boundary. API-focused testing with limited UI interaction tests remains proposed pending confirmation.
