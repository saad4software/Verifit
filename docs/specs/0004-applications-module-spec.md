# Spec: Applications Module

## Problem Statement

Job seekers struggle to manage multiple tailored submissions across different job opportunities. Currently, candidates must either manually rewrite resumes for every job or submit generic CVs that fail to pass ATS screenings and match key JD requirements. Furthermore, candidates lack visibility into whether their tailoring actually improved their match score against the job description, fear that AI tools will hallucinate unevidenced qualifications, must write bespoke cover letters from scratch, and have no central pipeline to track their submission progress from initial draft to offer or rejection.

## Solution

Provide a comprehensive Application Module where authenticated Users pair a saved Job Description with a baseline CV. The system evaluates the initial baseline fit score and gap analysis using the objective matching engine, then provides an asynchronous AI agent to tailor the CV summary, experience bullets, and highlighted skills strictly against evidenced facts. The matching engine automatically re-evaluates the tailored CV, displaying an empirical Old Score versus New Score comparison and a Requirement Delta showing which gaps were closed. Users can manually refine the tailored CV in the modular editor with on-demand re-scoring, generate a customized Cover Letter in their chosen tone, manage application stages across an interactive Kanban board, and export their materials via an Application Package drawer.

## User Stories

1. As a User, I want to open my Applications dashboard, so that I can see an overview of all my active job applications.
2. As a User, I want an empty state explaining how to create an application, so that I understand how to get started if I have no applications yet.
3. As a User, I want to click "New Application" and select a Job Description and a baseline CV, so that I can start a targeted application.
4. As a User, I want the application creation dialog to show only ready CVs, so that I cannot inadvertently base an application on an unparsed or failed CV.
5. As a User, I want the application creation dialog to allow selecting either ready or unconfirmed JDs, so that I do not have to complete full manual JD review before starting an application.
6. As a User, I want an initial baseline fit score calculated automatically upon application creation, so that I know my starting qualification alignment before tailoring.
7. As a User, I want an explicit "Tailor CV with Agent" button, so that AI generation is executed only when I deliberately trigger it.
8. As a User, I want clear multi-step progress feedback while tailoring is running, so that I know whether the system is analyzing gaps, rewriting sections, or calculating the new score.
9. As a User, I want the tailored CV to be saved as a distinct variant scoped to the application, so that my primary baseline CV is never mutated or overwritten.
10. As a User, I want tailored CVs hidden from my main CV catalog, so that my general CV library does not get cluttered with one-off variants.
11. As a User, I want the agent to rewrite my professional summary to target the role, so that the opening pitch directly highlights my relevant qualifications.
12. As a User, I want the agent to rephrase and reorder experience bullet points, so that relevant achievements and keywords matching the JD are emphasized.
13. As a User, I want the agent strictly prohibited from fabricating jobs, companies, dates, degrees, or unevidenced skills, so that my CV remains completely truthful.
14. As a User, I want the objective matching engine run automatically against the tailored CV, so that I can see an independently verified new score.
15. As a User, I want a visual Score Delta card showing Old Score, New Score, points gained, and gaps closed, so that I have immediate proof of improvement.
16. As a User, I want a Requirement Delta matrix, so that I can see exactly which JD requirements moved from unevidenced or partial to met.
17. As a User, I want a visual diff between the original and tailored CV, so that I can quickly review all text modifications made by the agent.
18. As a User, I want to manually edit any part of the tailored CV, so that I retain full authorial control over the final wording.
19. As a User, I want an on-demand "Re-score" button after editing my tailored CV, so that the displayed fit score stays accurately synchronized with my edits.
20. As a User, I want to generate a customized Cover Letter on demand, so that I have a compelling narrative tailored to the JD without writing it manually.
21. As a User, I want to choose a tone for my Cover Letter (professional, conversational, executive), so that the voice matches company culture.
22. As a User, I want to add optional personal notes (such as a referral or relocation note) to the cover letter prompt, so that specific personal details are incorporated.
23. As a User, I want an editable Cover Letter workspace, so that I can make manual tweaks before sending.
24. As a User, I want to view my applications organized on an interactive Kanban board by status (`draft`, `applied`, `interviewing`, `offered`, `rejected`), so that I can track my overall recruitment pipeline.
25. As a User, I want to drag cards between columns or update status from a card menu, so that keeping my application status updated is effortless.
26. As a User, I want to toggle between a Kanban view and a compact table view, so that I can choose my preferred layout.
27. As a User, I want an Application Package drawer, so that I can access all final application materials in one place.
28. As a User, I want to download my tailored CV as an ATS-formatted PDF in one click, so that it is ready to submit.
29. As a User, I want to copy my Cover Letter to the clipboard or download it as text, so that I can paste or upload it into job portals.
30. As a User, I want a quick link to the original job posting URL, so that I can jump directly to the submission portal.
31. As a User, I want deleting an application to cascade delete its tailored CV and match documents, so that no orphaned records remain.
32. As a User, I want baseline CVs and JDs protected from deletion while active applications depend on them, so that I cannot accidentally break my application history.
33. As an unauthenticated visitor, I want to be redirected to sign in before accessing the applications module, so that private application data remains secure.

## Implementation Decisions

- **Domain Entity & Storage Boundary**: Applications are modeled as first-class documents in Sanity CMS (`_type: "application"`) with tenant isolation enforced via `userId` matching Better Auth credentials.
- **Application Model**: An Application document holds references to `jd`, `baseCv`, `tailoredCv`, `baselineMatch`, and `tailoredMatch`. It manages external recruitment status (`draft`, `applied`, `interviewing`, `offered`, `rejected`), internal tailoring status (`idle`, `running`, `completed`, `failed`), `coverLetter` text, `coverLetterTone`, `notes`, and `appliedAt` timestamp.
- **Tailored CV Scoping**: Tailoring creates a full Sanity `cv` document with `isTailored: true` and `applicationId: application._id`. The core CV service filters out tailored CVs from the primary catalog query unless explicitly requested within an application context.
- **Dual Matching Evaluation**: Fit scoring utilizes the existing `modules/matching` engine without modification. Baseline fit is evaluated on `(baseCv, jd)`, and tailored fit is evaluated on `(tailoredCv, jd)`. This guarantees objective scoring parity and prevents generative self-scoring bias.
- **Tailoring Agent Action**: Agent execution utilizes Sanity Agent Actions targeting the CV schema (`summary` and `sections`) with `noWrite: true`. Instructions mandate preserving factual truthfulness, prohibiting invented roles or degrees, and optimizing summary and bullet point phraseology against stated JD requirements and identified gaps.
- **Cover Letter Generation**: Cover Letter generation operates via a dedicated Sanity Agent Action targeting a lightweight application generation schema, synthesizing JD company/role requirements and verified candidate experience into markdown text.
- **Interactive Kanban & Table Dashboard**: The `/applications` route provides an interactive drag-and-drop Kanban board grouped by status with real-time status patches, alongside a searchable, sortable compact table view.
- **Cascade Deletion & Parent Protection**: Deleting an application systematically deletes its scoped tailored CV and associated `cvMatch` records. Deleting a baseline CV or JD is guarded on the server if referenced by any existing application.
- **Application Package**: An export drawer brings together one-click PDF generation (reusing existing printable CV stylesheets), cover letter copying/export, and source JD external links.

## Testing Decisions

- **Quality Standard**: Tests must assert observable external behaviors: API contracts, HTTP response status and payloads, persisted Sanity document state, authorization isolation, and user-visible UI feedback. Avoid asserting internal helper calls, prompt text, or incidental call ordering.
- **Primary Testing Seam (Highest Seam)**: The primary automated test seam is the **Next.js Public Route Handlers** (`/api/applications/*`) using Vitest in a `node` environment.
  - Real domain services, Zod schemas, lifecycle logic, and scoring calculations are retained.
  - Authenticated sessions are substituted via the existing test session mock.
  - External Sanity CMS mutations and Agent Actions are substituted at the client boundary using the repository's established `getMockSanityClient()` and agent client mocks.
  - Background asynchronous tasks are awaited deterministically.
- **Secondary Testing Seam (UI Interactions)**: Focused React Testing Library component tests in `jsdom` (`tests/unit/applications-components.test.tsx`) covering:
  - Kanban board column rendering and status drag/drop transitions.
  - Score Delta card calculation and visual presentation.
  - Requirement Delta matrix status highlighting.
  - New Application modal submission and error handling.
- **Prior Art**: 
  - `tests/unit/cv-api.test.ts` & `tests/unit/jd-api.test.ts` establish public route testing patterns with session and Sanity client mocks.
  - `tests/unit/matching-lifecycle.test.ts` establishes lifecycle and background worker test patterns.
  - `tests/unit/jd-components.test.tsx` and `cv-components.test.tsx` establish RTL component testing patterns.

## Out of Scope

- Automated direct submission or scraping of third-party applicant tracking systems (e.g. Workday, Greenhouse, Lever).
- Chrome extension for auto-filling job board forms.
- Synchronous multi-LLM consensus voting or multi-agent debate panels.
- Automated email sending to recruiters or hiring managers.
- Salary negotiation simulators or interview transcription analysis.

## Further Notes

The domain model, architectural decisions, and requirements were settled collaboratively through the `/grill-with-docs` interview rounds on 2026-09-20 and recorded in [CONTEXT.md](../../CONTEXT.md) and [ADR 0008](../../docs/adr/0008-application-module-architecture.md).

No remote issue-tracker configuration (such as GitHub Issues or Linear) is currently authenticated in the environment. Run `/setup-matt-pocock-skills` to configure remote issue publishing. This local specification is committed in the repository at `docs/specs/0004-applications-module-spec.md` with the `ready-for-agent` triage status.
