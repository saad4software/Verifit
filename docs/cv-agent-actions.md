# CV generation with Sanity Agent Actions

CV imports extract text from PDF, DOCX, or pasted text and store it on the user's
Sanity CV document. The background worker calls Sanity Generate with the deployed
`cv` schema and the raw text as a constant instruction parameter. Local SQLite
continues to own users and authentication.

## Setup

1. Configure `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and a
   server-only `SANITY_API_TOKEN` with access to write CV documents and use Agent
   Actions. `SANITY_API_WRITE_TOKEN` is also accepted.
2. Run `npx sanity schemas deploy` for the configured Studio and dataset.
3. Run `npx sanity schemas list` and copy the deployed schema ID into the
   server-only `SANITY_AGENT_SCHEMA_ID` environment variable.
4. Restart the application. Redeploy the schema whenever its CV types change.

Agent Actions use a dedicated client with API version `vX`, as required by
Sanity. Normal document reads and writes keep their configured API version.
The project must have Agent Actions available and sufficient quota.

## Persistence and failures

Generate runs with `noWrite: true` and targets only `personalInfo`, `summary`, and
`sections`, including nested content. The application validates the response and
patches only those fields onto the original CV, together with the ready status.
It does not create a separate draft or accept generated ownership metadata.
The prompt instructs extraction of source facts, omission of unknown details,
and preservation of unusual content in custom sections. AI output still needs
user review for factual accuracy.

API or validation failures mark the CV failed and retain the source for retry.
Missing credentials fail explicitly instead of silently using local parsing or
in-memory storage. `MOCK_SANITY=true` is for storage-only offline development;
real generation requires disabling it. Automated tests mock the Agent Actions
boundary and make no paid requests.

The existing Next.js `after()` worker is subject to the hosting platform's route
execution duration. Configure sufficient duration for AI calls when deploying.

References: [Generate quick start](https://www.sanity.io/docs/agent-actions/generate-quickstart),
[Agent Actions operations](https://www.sanity.io/docs/agent-actions/operations).
