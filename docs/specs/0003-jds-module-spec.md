# Spec: Job Descriptions Module

## Problem Statement

Users need to capture job ads and understand their qualifications before choosing the best CV for an opportunity. Ads arrive as pasted text or web pages and express requirements inconsistently. Losing distinctions between required and preferred qualifications, inventing missing requirements, or flattening alternatives would make later CV matching unreliable.

## Solution

Provide a private JD library where authenticated Users submit one ad as text or a URL. Retrieve and extract web content before using the existing agent client to identify and structure the JD. Retain its JD Source, show editable structured information alongside supporting excerpts, and require JD Review before marking it ready for future matching. Provide clear recovery from failed imports and reviewable replacements when reprocessing existing content.

## User Stories

1. As a User, I want to open my JD library, so that I can manage saved opportunities.
2. As a User, I want an empty state explaining how to add a JD, so that I can begin without guidance.
3. As a User, I want to paste an ad as plain text, so that I can import content from any source.
4. As a User, I want to supply a web page URL, so that I can avoid copying an accessible ad manually.
5. As a User, I want invalid or empty input explained, so that I can correct it before processing.
6. As a User, I want to import one ad at a time, so that separate opportunities remain separate JDs.
7. As a User, I want input exceeding 50,000 characters rejected with an explanation, so that no requirements disappear through silent truncation.
8. As a User, I want processing progress, so that I know whether text extraction or structuring is underway.
9. As a User, I want to reopen an import and see its status, so that navigation does not lose my work.
10. As a User, I want inaccessible URL imports to offer pasted text within the same import, so that I can continue without restarting.
11. As a User, I want useful failure messages, so that I know how to recover.
12. As a User, I want interrupted processing to become retryable, so that an import never remains stuck indefinitely.
13. As a User, I want extracted source text retained after agent failure, so that retrying does not require resubmission.
14. As a User, I want job title, company, responsibilities, and seniority extracted, so that I can understand the opportunity.
15. As a User, I want skills and experience requirements extracted individually, so that future comparisons can assess them accurately.
16. As a User, I want education, certifications, and language qualifications extracted, so that I can inspect the full qualification set.
17. As a User, I want location, work arrangement, employment type, compensation, and stated eligibility constraints captured, so that I can inspect practical conditions.
18. As a User, I want required, preferred, and unspecified qualifications distinguished, so that ambiguity is preserved.
19. As a User, I want missing information left empty, so that the application does not invent requirements.
20. As a User, I want supporting excerpts associated with extracted qualifications, so that I can verify the interpretation.
21. As a User, I want alternatives such as a degree or equivalent experience preserved, so that future matching does not require both.
22. As a User, I want nested experience durations preserved, so that five years overall including two in React does not become seven years.
23. As a User, I want the original language preserved, so that translation does not change the ad's meaning.
24. As a User, I want incomplete descriptions accepted with warnings, so that I can work with the information available.
25. As a User, I want unrelated content rejected, so that it does not become a misleading JD.
26. As a User, I want multiple-job input to request one specific ad, so that jobs are not merged.
27. As a User, I want extraction saved as needs review, so that unverified results are distinguishable from ready JDs.
28. As a User, I want structured fields and source text visible together, so that I can review efficiently.
29. As a User, I want to correct fields and supporting excerpts, so that extraction mistakes can be fixed.
30. As a User, I want unsupported additions flagged before readiness, so that the JD remains faithful to the ad.
31. As a User, I want to confirm my review, so that the JD becomes ready for future matching.
32. As a User, I want saved content edits to require review again, so that readiness reflects the current content.
33. As a User, I want a Save and confirm shortcut, so that a reviewed correction does not require unnecessary steps.
34. As a User, I want reprocessing to use retained text by default, so that retries use the same evidence.
35. As a User, I want refetching the URL to be explicit, so that changes to an online ad do not silently change my JD.
36. As a User, I want a proposed replacement reviewed separately, so that reprocessing cannot overwrite my edits automatically.
37. As a User, I want my existing ready JD usable while a replacement is pending or fails, so that reprocessing does not remove reviewed work.
38. As a User, I want accepting a replacement to swap its source and structured content together, so that evidence remains aligned.
39. As a User, I want rejecting a replacement to preserve the existing JD, so that I can safely discard an unwanted result.
40. As a User, I want a warning when I import a URL already in my library, so that I can open the existing JD or deliberately create a separate copy.
41. As a User, I want my JDs private and independent of other Users' imports, so that nobody else can access or change them.
42. As a User, I want JDs independent of individual CVs, so that I can later compare multiple CVs against one opportunity.
43. As a User, I want to delete a JD after confirmation, so that its source and pending replacement are removed with it.
44. As an unauthenticated visitor, I want to be directed to sign in before accessing the JD library, so that private content stays protected.

## Implementation Decisions

- **Architecture:** Add a cohesive JDs domain module with thin application routes. Follow the existing modular architecture and identity/content separation ADRs. Store JD content in Sanity and derive ownership from the authenticated Better Auth User; identity remains in SQLite. Do not introduce CV ownership links or a Primary JD concept.
- **Public operations:** Provide import, list, detail, status, edit, confirm review, retry, explicit refetch, accept/reject replacement, and delete operations. Every operation enforces ownership on the server, including status, duplicate lookup, sources, and replacements. Foreign and missing documents produce indistinguishable not-found responses. Clients cannot set ownership, processing metadata, or readiness through unrestricted content patches.
- **Import contract:** Accept exactly one of text or URL for one job. Reject blank input and text above 50,000 characters, applying the same limit after URL extraction. Do not silently truncate. An inaccessible URL can be supplemented by pasted text in the existing import, preserving the URL as provenance without claiming that the pasted text was fetched.
- **URL extraction:** Fetch public HTTP(S) pages server-side. Prefer an unambiguous embedded JobPosting's description and relevant qualification data, converted to readable text; otherwise use Mozilla Readability on retrieved HTML. Retain the actual text submitted to the agent. Do not choose arbitrarily among multiple distinct jobs or merge them. Retrieval precedes agent invocation; the agent client is not the web fetcher.
- **Retrieval boundaries:** Treat URLs and page content as untrusted. Restrict fetches to public destinations, validate redirected destinations, and enforce finite network, redirect, and response-size limits. Page parsing must not execute scripts. Render retained content as text. These are implementation safeguards for the agreed import behavior, not added user approval steps.
- **Agent integration:** Reuse the existing Sanity Agent Actions client and schema-driven generation pattern. Supply source text as data, request generation without automatic writes, validate returned content, and persist only explicitly permitted fields. Deploy the JD schema before enabling generation. Returned ownership, review status, or processing metadata must never override server-managed values.
- **Structured content:** Capture title, company, responsibilities, seniority, skills, experience, education, certifications, languages, location, work arrangement, employment type, compensation, and explicit eligibility constraints. Missing values remain absent. Preserve source-language wording, compensation units and periods, and original qualification expressions without inventing normalized facts.
- **Qualification representation:** Store qualifications individually with category, source-supported content, required/preferred/unspecified classification, and supporting excerpts. Preserve all-of versus any-of relationships and nested experience durations. Do not flatten alternatives or add overlapping durations. Shared evidence can support multiple related fields.
- **Evidence and review:** Associate evidence with the exact retained source version. Validate excerpt existence and structured shape on the server. An excerpt's presence alone does not prove that it supports a claim: use semantic validation through the agent client for edited claims, with actionable findings for unsupported additions. Unresolved evidence or support findings prevent confirmation. Human review remains required; automated validation is not a guarantee of correctness. This validation mechanism is an implementation proposal that fulfills the accepted evidence requirement.
- **Input assessment:** Identify single-job, multiple-job, and unrelated content during processing. Accept incomplete but recognizable JDs with warnings. Missing optional information does not itself prevent readiness. Multiple-job and unrelated input must not produce a confirmable Structured JD.
- **Lifecycle:** Distinguish processing progress from review readiness and replacement progress. Initial processing moves through extraction when needed and structuring, then needs review or a recoverable failure. Successful extraction never directly grants readiness. Explicit valid confirmation produces ready. Saving content edits returns the current JD to needs review; Save and confirm applies the same validation before granting readiness.
- **Background recovery:** Follow the existing asynchronous import and polling pattern, while adding bounded attempts and persisted attempt identity/timestamps so interrupted work eventually becomes retryable. Status reads or retries can detect expired attempts. Guard writes against stale attempts, deletion, and concurrent edits; late completion cannot overwrite newer content or recreate a deleted JD. Do not equate an in-process background callback with durable execution.
- **Replacements:** Keep current source/content and at most one pending replacement with its own source/content. Retry structuring from retained text; only explicit refetch retrieves the URL again. Current readiness and content survive replacement failure or rejection. Acceptance performs validated, revision-checked replacement of source and content together and marks the result ready. Conflicting edits require reload/review rather than silent overwrite. Additional replacement requests must not silently discard an unreviewed replacement.
- **Duplicates:** Check repeat URLs only within the authenticated User's library. Warn and offer opening the existing JD or explicitly creating a separate copy. Normalize URLs conservatively without dropping parameters that may identify different jobs; no cross-user deduplication or disclosure.
- **Management UI:** Add the JD library, empty state, text/URL import, progress and recovery, detail/review editor, replacement review, duplicate choice, and deletion confirmation to the existing product shell. Make validation messages and controls accessible and usable on narrow screens.
- **Deletion:** Delete current content, retained source, and pending replacement together. Full version history is not retained. Deletion or replacement must not leave orphaned source content.

## Testing Decisions

- **Approval status:** The following test boundaries are proposed and await the User's confirmation required by the to-spec workflow. Product behavior is already confirmed.
- **Quality standard:** Assert externally visible behavior: API responses, subsequently readable persisted state, source/content consistency, privacy, and user-visible controls. Avoid asserting private helper calls, prompt wording, component internals, or incidental storage call order.
- **Primary boundary:** Exercise the JDs module through its public API route handlers using Vitest, following the existing CV API integration tests. Keep real domain services, schemas, lifecycle logic, and URL parsing. Substitute authenticated sessions and external Sanity storage, Agent Actions, network responses, clock, and background scheduling at their boundaries. Await controlled background work deterministically rather than sleeping.
- **Prior art:** Existing CV API tests establish route-handler integration with session and Sanity substitutes. CV service tests cover isolation, malformed generation, retained source, and retry. CV editor/component tests establish React Testing Library interaction patterns. Reuse these patterns without copying assertions about internal calls or duplicating every scenario at service and API levels. The current component test environment is jsdom.
- **Import coverage:** Test pasted text; structured JobPosting HTML; Readability fallback; malformed, blocked, or script-dependent pages; unsafe destinations and redirects; empty input; exactly 50,000 and 50,001 characters; multiple jobs; unrelated input; incomplete ads; and non-English content. Use local fixtures and controlled HTTP responses, not live job boards.
- **Structuring coverage:** Test valid and malformed agent responses, attempts to inject metadata, absent fields, each qualification classification, evidence mismatch, unsupported corrections, degree-or-experience alternatives, and overlapping experience durations. Stubbed output tests prove application handling, not model extraction quality; use a small representative manual agent smoke check when credentials and the deployed schema are available.
- **Lifecycle coverage:** Test initial needs review, confirmation, edits invalidating readiness, Save and confirm, failed and interrupted processing, retry from retained source, explicit refetch, replacement acceptance/rejection/failure, atomic source/content switching, expired attempt completion, concurrent edits, and deletion during processing.
- **Privacy and management coverage:** Test unauthenticated operations, every cross-user read/write operation, duplicate detection limited to the current User, explicit duplicate creation, list/detail/status, and deletion of current and pending content.
- **Focused UI boundary:** Use a small number of React Testing Library interaction tests for source-side review, unsupported-field feedback, Save and confirm, pasted fallback, replacement choice, duplicate choice, and deletion confirmation. These complement API tests only where visible interaction cannot be established through API behavior.
- **Validation:** Run relevant automated tests, type checking, and repository lint checks during implementation. Add a browser smoke check for the integrated import-to-review journey if needed; avoid reproducing the full API matrix in browser tests.

## Out of Scope

- CV matching, ranking, scoring, tailoring, or selecting a best CV.
- Shared/public JD libraries, cross-user deduplication, and JD-to-CV assignment.
- File uploads, batch imports, search-result ingestion, and automatic multi-job splitting.
- Browser-rendered scraping, authenticated job-board sessions, bypassing blocked pages, and paid extraction services.
- Automatic URL refresh, job monitoring, and scheduled reprocessing.
- Full version history and multiple pending replacements.
- Translation, cross-language skill normalization, invented qualifications, and personal matching preferences.
- Application submission or job-application tracking.

## Further Notes

The User confirmed the complete product design on 2026-09-20. This specification synthesizes that agreement and existing module conventions; implementation safeguards and the proposed evidence-validation mechanism are identified above rather than presented as additional interview decisions.

No project issue-tracker configuration or triage-label mapping was found. Run `/setup-matt-pocock-skills` to configure publishing. This local specification is not yet published as an issue and has not been assigned a tracker label. Once the testing boundaries are confirmed and the tracker is configured, publish this specification with the `ready-for-agent` triage label.
