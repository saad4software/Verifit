# 07: Delete a JD and its retained content

**What to build:** Confirm deletion of a JD from the library and remove its retained content permanently from application access.

**Blocked by:** 01 — Import pasted text into a private JD library

**Status:** draft — awaiting breakdown approval and tracker configuration

- [ ] Provide deletion confirmation in the UI; cancellation changes nothing.
- [ ] Delete current structured content, retained source, and any pending replacement together; account for the pending-replacement contract even if its UI is implemented later.
- [ ] Deleted JDs disappear from the library and return not found from detail/status operations.
- [ ] Enforce ownership and ensure an in-flight or late processing result cannot recreate deleted content.
- [ ] Test deletion, cancellation, ownership, and deletion during processing; extend coverage for actual replacement processing when that slice is present.

Each slice includes the necessary data model, server operations, UI, and behavioral tests. Follow the existing domain vocabulary, modular architecture, and identity/content storage boundary. API-focused testing with limited UI interaction tests remains proposed pending confirmation.
