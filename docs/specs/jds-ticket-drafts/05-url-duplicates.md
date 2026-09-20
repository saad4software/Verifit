# 05: Recognize duplicate URL imports

**What to build:** Recognize an ad URL already in the User’s library and choose whether to open it or create an independent copy.

**Blocked by:** 04 — Import a JD from a URL

**Status:** draft — awaiting breakdown approval and tracker configuration

- [ ] Warn before creating a duplicate for the current User; provide open-existing and explicit create-copy actions.
- [ ] Normalize URLs conservatively and retain parameters that can distinguish jobs.
- [ ] Duplicate lookup neither queries nor discloses another User’s imported JDs.
- [ ] An explicitly created copy has independent identity, review state, and content.
- [ ] Test duplicate choices, meaningful query parameters, and cross-user isolation through API behavior and the visible choice controls.

Each slice includes the necessary data model, server operations, UI, and behavioral tests. Follow the existing domain vocabulary, modular architecture, and identity/content storage boundary. API-focused testing with limited UI interaction tests remains proposed pending confirmation.
