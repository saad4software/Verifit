# 02: Review, correct, and confirm a JD

**What to build:** Review source and structured fields together, correct extraction mistakes, and explicitly confirm a JD as ready.

**Blocked by:** 01 — Import pasted text into a private JD library

**Status:** draft — awaiting breakdown approval and tracker configuration

- [ ] Provide editable structured fields and evidence alongside the retained source, including alternatives and nested experience requirements.
- [ ] Validate structured shape and excerpt correspondence on the server; flag claims unsupported by their evidence, including edited claims. An excerpt match alone is not semantic proof.
- [ ] Use the spec’s proposed agent-based semantic check for edited claims; surface validation failures without losing edits or granting readiness.
- [ ] Allow saving corrections as needs review; block confirmation while support findings remain unresolved. Missing optional information alone does not block confirmation.
- [ ] Explicit confirmation marks valid content ready; saving content edits returns it to needs review; Save and confirm performs the same checks.
- [ ] Reject stale edits rather than silently overwriting newer content; protect readiness from unrestricted client patches.
- [ ] Cover confirmation, unsupported edits, evidence mismatch, concurrency, and ownership through API tests; use focused UI tests for review feedback and Save and confirm.

Each slice includes the necessary data model, server operations, UI, and behavioral tests. Follow the existing domain vocabulary, modular architecture, and identity/content storage boundary. API-focused testing with limited UI interaction tests remains proposed pending confirmation.
