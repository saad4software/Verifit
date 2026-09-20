# Job description imports and review

The private JD library is available at `/jds`. Text and public HTTP(S) URL imports
retain their evidence in the same Sanity document as structured content. JDs have
no CV links. Better Auth provides the owner for every server operation.

## Deployment

1. Use a private Sanity dataset and configure the server-only Sanity write token.
   The application's ownership checks protect application routes; the dataset
   must also prohibit anonymous direct reads of private CV/JD documents.
2. Deploy the updated Studio schema with `npx sanity schemas deploy` and inspect
   `npx sanity schemas list`. It must include `jdGeneration` and `jdSupport` as
   well as the JD content types.
3. Set `SANITY_JD_AGENT_SCHEMA_ID` to that deployed schema ID and restart the app.
   JD generation remains disabled until this variable is present. The existing
   CV schema ID setting is independent.
4. Allow up to 300 seconds for the import/action routes on the hosting platform.
   Node.js is required for public-address-pinned HTTP requests and HTML parsing.

Generate and support-check actions always use `noWrite: true`. Only validated
content is persisted; generation cannot assign owners or grant readiness. Review
of edited claims performs another agent action, so it requires Agent Actions
availability and consumes its quota. It complements explicit human review.

## Lifecycle and recovery

Initial extraction/structuring runs in Next.js `after()`. This is bounded process
execution, not a durable queue. Persisted attempts expire after five minutes;
detail/status reads expire interrupted work, and workers cannot publish expired
results. Users may retry initial structuring up to five attempts. Failure retains
extracted text. Failed URL extraction offers pasted text in the same import,
retaining the URL as provenance without labelling the pasted text as fetched.

Reprocess uses retained text. Only Refetch URL retrieves again. A single pending
replacement has its own source and content while the current version remains
available. Accept swaps source and content atomically and confirms readiness;
Reject drops the replacement. Failed replacements can be rejected before retry.
Sanity revision preconditions reject stale edits, stale workers, and conflicting
acceptance. Deleting the one JD document removes both sources and all content.

## Verification

`tests/unit/jd-api.test.ts` exercises real route handlers and domain logic with
external session, Sanity, agent, network, clock, and scheduler substitutes.
`tests/unit/jd-components.test.tsx` covers visible review/recovery choices.

For a live smoke check after deployment, import a short source containing an
explicit required skill, a preferred skill, degree-or-experience alternatives,
and overlapping experience. Verify exact excerpts, original language, empty
unstated fields, and needs-review status. Correct a claim to an unsupported one
and verify confirmation is blocked. Restore it, confirm, and reprocess; verify
current readiness survives until replacement acceptance. Automated agent stubs
verify application handling, not model extraction quality.
