# Application Module Architecture

## Context
Users need to pair a specific Job Description (JD) with a baseline CV to track job applications, tailor their CV to match stated requirements, objectively compare fit before and after tailoring, and generate a bespoke cover letter. We needed to define the storage boundary, relationship modeling, and AI processing pipeline for applications.

## Decision
1. **Application Storage & Aggregation**: Applications are stored in Sanity CMS (`_type: "application"`) scoped by `userId`. The document references a `jd` and a baseline `cv`, records external `status` (`draft`, `applied`, `interviewing`, `offered`, `rejected`), contains an editable `coverLetter` text field, and references the baseline and tailored match records.
2. **Application-Scoped Tailored CV**: Tailoring generates a full `cv` document referencing the parent `application` and source `cv`. It is flagged to remain scoped to the application workspace so it does not clutter the user's primary CV catalog while remaining compatible with existing CV rendering and PDF generation pipelines.
3. **Dual Matching Evaluation Pipeline**: Rather than relying on non-deterministic LLM self-scoring, fit is measured by running the established `modules/matching` engine twice: first on the baseline CV + JD (`baselineMatch`), then on the Tailored CV + JD (`tailoredMatch`), producing verified comparative scores and gap closure metrics.
4. **Tailoring Agent Guardrails**: The tailoring agent restructures summaries, emphasizes relevant experiences, and surfaces matching skills, strictly governed by anti-hallucination guardrails prohibiting the invention of unevidenced roles, credentials, or technologies.
5. **Decoupled Cover Letter Generation**: The cover letter is generated on demand against the JD requirements and validated candidate evidence, storing editable markdown directly on the application.
6. **Asynchronous Tailoring Lifecycle**: Tailoring executes as an asynchronous pipeline with status tracking (`idle`, `running`, `completed`, `failed`), providing transparent step-by-step progress feedback.
7. **Post-Tailoring Editing with On-Demand Rescoring**: Tailored CVs remain fully editable using the modular CV editor; saving modifications exposes an on-demand rescore action to keep the fit score strictly synchronized with user changes.
8. **Interactive Kanban & List Dashboard**: Applications are managed at `/applications` via an interactive Kanban board categorized by external status (`draft`, `applied`, `interviewing`, `offered`, `rejected`), featuring score deltas, company info, and an alternate compact table view.
9. **Cascading Deletion of Scoped Artifacts**: Deleting an Application permanently deletes its scoped Tailored CV and associated match documents to prevent orphaned records in Sanity. Baseline CVs and JDs are protected against deletion while referenced by active Applications.
10. **Sanity Agent Actions Schema Integration**: Tailoring and Cover Letter generation execute via Sanity Agent Actions targeting schemas (`cv` and `applicationGeneration`), maintaining consistency with the headless, zero-draft pattern used throughout the app.
11. **Unified Application Package**: Export flows are consolidated in an Application Package drawer offering tailored CV PDF download, cover letter copying/export, and direct links to the external job opportunity.

## Consequences
- Preserves integrity of baseline CVs while enabling infinite bespoke application variants.
- Guarantees scoring consistency through identical objective evaluation logic before and after tailoring.
- Application tracker integrates job-seeking workflow without requiring a separate tracking database.
- Users maintain total authorial control over tailored content while preserving empirical score fidelity.
- Eliminates orphaned data via automated cascade deletion of application-scoped documents.

