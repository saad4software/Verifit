# 04: Import a JD from a URL

**What to build:** Supply a public job-ad URL, obtain structured content, or continue the same import by pasting the ad when retrieval fails.

**Blocked by:** 01 — Import pasted text into a private JD library

**Status:** draft — awaiting breakdown approval and tracker configuration

- [ ] Provide text/URL input choices and require exactly one input source per submission.
- [ ] Fetch public HTTP(S) pages with bounded time, redirects, and response size; validate destinations including redirects and prevent access to private or local network destinations.
- [ ] Prefer unambiguous embedded JobPosting description and qualification data, then use Readability fallback; parsing executes no page scripts.
- [ ] Retain the actual readable text supplied to the agent and source URL; apply the 50,000-character limit after extraction without truncation.
- [ ] Do not arbitrarily choose among distinct jobs or merge them; unrelated content cannot become a confirmable JD.
- [ ] Show extraction and structuring progress; inaccessible, blocked, or script-dependent pages offer pasted text within the same import.
- [ ] Preserve the URL as provenance when pasting fallback text, without claiming the text was fetched; render source as text.
- [ ] Test structured markup, fallback extraction, redirects, unsafe destinations, limits, multiple jobs, and pasted recovery through API fixtures, with a focused UI fallback test.

Each slice includes the necessary data model, server operations, UI, and behavioral tests. Follow the existing domain vocabulary, modular architecture, and identity/content storage boundary. API-focused testing with limited UI interaction tests remains proposed pending confirmation.
