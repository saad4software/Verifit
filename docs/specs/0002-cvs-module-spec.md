# Spec: CVs Module (Document Ingestion, Sanity Storage, and AI Structuring)

## Problem Statement

Users of Verifit need to store, inspect, and manage structured CVs to power personalized CV tailoring workflows. Currently, no mechanism exists for users to import career histories from existing documents (PDF, DOCX) or raw text, nor is there a structured data model in Sanity CMS to represent CVs with industry-standard, ATS-friendly sections. Without an automated ingestion pipeline and structured content schema, users would have to manually re-enter their entire career history.

## Solution

Implement an encapsulated CVs module that allows authenticated users to import resumes via file upload (PDF/DOCX) or raw text input. The ingestion pipeline:
1. Safely parses documents in server memory with a strict 5 MB payload limit.
2. Persists a Sanity document scoped strictly to the authenticated user's ID.
3. Uses an asynchronous background lifecycle to coordinate text extraction and Sanity Agent Actions for schema-aware structuring.
4. Provides real-time lifecycle tracking through an Ingestion Status state machine and a responsive progress stepper.
5. Employs a hybrid modular Sanity schema combining core identity fields with an ordered, polymorphic sequence of CV sections (Work Experience, Education, Skills, Projects, Certifications, Languages, and Custom sections).
6. Delivers an interactive in-app editor and live preview surface with Primary CV designation.

## User Stories

1. As an authenticated user, I want to navigate to the CV dashboard to view all my saved CVs, their titles, creation dates, primary indicators, and current ingestion statuses.
2. As an authenticated user, I want to see a clear empty state on my dashboard when I have no saved CVs, prompting me to import my first CV.
3. As an authenticated user, I want an import view that allows me to either drag and drop / upload a document file (PDF or DOCX) or paste raw text.
4. As an authenticated user, I want immediate validation if my uploaded file exceeds 5 MB or uses an unsupported file extension, so that I do not wait on invalid uploads.
5. As an authenticated user, I want to optionally provide a custom title for my imported CV, falling back to a timestamped default if left blank.
6. As an authenticated user, I want submitting an import to immediately redirect me to my new CV's view page displaying a live multi-stage progress stepper.
7. As an authenticated user, I want the progress stepper to clearly reflect each stage of ingestion: extracting text, structuring with the AI agent, and ready.
8. As an authenticated user, I want the system to preserve my extracted raw text even if AI structuring fails, so that I never lose uploaded content.
9. As an authenticated user, I want to see an informative error message and a "Retry Structuring" button if AI structuring fails, allowing me to retry without re-uploading.
10. As an authenticated user, I want my very first imported CV to be automatically designated as my Primary CV.
11. As an authenticated user, I want to be able to designate any of my CVs as my Primary CV, with the system automatically removing the primary designation from any previous CV.
12. As an authenticated user, I want to view my structured CV rendered cleanly with distinct, legible sections for Personal Info, Professional Summary, Work Experience, Education, Skills, Projects, Certifications, Languages, and Custom Sections.
13. As an authenticated user, I want to edit personal contact details (full name, email, phone, location, links) directly within the CV editor.
14. As an authenticated user, I want to edit bullet points, dates, roles, and company names within the Work Experience section.
15. As an authenticated user, I want to add, remove, and reorder modular CV sections within the CV editor.
16. As an authenticated user, I want to delete a CV after confirming the action, removing it from my list and database.
17. As an authenticated user, I want changes made in the CV editor to save reliably back to Sanity.
18. As a security-conscious user, I want my CVs to be strictly isolated so that other users cannot read, edit, or delete my documents.
19. As an unauthenticated visitor, I want any attempt to access CV routes or APIs to be redirected to the login page.
20. As an administrator or content editor, I want CV documents to conform to the Sanity Studio schema so that editorial workflows and inspection remain consistent in the CMS.
21. As a developer, I want all document parsing and multi-tenant authorization logic covered by automated tests that execute quickly without relying on external network calls.

## Implementation Decisions

- **Modular Architecture**: The feature is encapsulated within the CVs domain module, separating schema definitions, file parsing, Sanity Agent Actions, and business services from the Next.js presentation layer and route adapters.
- **Sanity Document Schema**:
  - The root document type is a CV containing metadata (`title`, `userId`, `isPrimary`, `ingestionStatus`, `rawText`, `errorMessage`), core identity (`personalInfo`, `summary`), and an ordered polymorphic array of sections.
  - Ingestion status values follow the strict domain lifecycle: `pending`, `extracting`, `structuring`, `ready`, `failed`.
  - Standard section blocks include Work Experience, Education, Skills (categorized groups), Projects, Certifications, Languages, and Custom Sections.
- **Server-Side Tenancy & Access Boundary**:
  - End-users do not interact with Sanity Studio directly or query Sanity with public client tokens.
  - All CV operations are mediated by server-side endpoints requiring a valid Better Auth session, using a privileged server-side Sanity client that strictly enforces `userId == session.user.id`.
- **In-Memory File Parsing**:
  - Uploaded PDF and DOCX files are processed in server memory without writing temporary files to disk.
  - A 5 MB payload limit is enforced at the route boundary before buffering.
  - Extracted raw text is normalized and persisted on the CV document, while the binary source file is discarded.
- **Asynchronous Ingestion State Machine**:
  - The import endpoint creates the CV document with status `extracting`, schedules text extraction and AI structuring in a background execution hook, and immediately returns the newly created CV ID.
  - The client polls a dedicated status endpoint until the document reaches `ready` or `failed`.
- **Sanity Agent Actions for Structuring**:
  - Structuring is performed headlessly via Sanity Agent Actions, translating unformatted raw text into validated, schema-compliant sections.
- **Soft Failure Recovery**:
  - AI failures update the document status to `failed` with an explanatory error message, retaining the extracted raw text so users can trigger a retry or edit manually.
- **Single-Active Primary CV Logic**:
  - When a user designates a CV as Primary, the server unsets the primary flag on all other CV documents owned by that user.

## Testing Decisions

- **Test Quality Standard**: Tests must verify observable external behavior (HTTP response codes, JSON payloads, document persistence, authorization enforcement, and DOM feedback) rather than internal implementation details.
- **Testing Seams**:
  - *Primary Seam (API & Contract Integration)*: Vitest executing against Next.js route handlers with authenticated session mocks and a mock Sanity client. Tests verify document creation, status polling progression, tenancy scoping (ensuring users cannot read/modify other users' CVs), payload rejection on oversized files, and retry mechanics.
  - *Secondary Seam (Document Parser Unit)*: Vitest executing against the document parsing functions with sample PDF, DOCX, and plain-text buffers, verifying accurate text extraction and graceful error handling on malformed binaries.
  - *Tertiary Seam (UI Component)*: Vitest paired with React Testing Library and `happy-dom`, verifying the import form tab switching, client-side validation, and the multi-step progress stepper transitions.
- **Prior Art**: Mirrors the testing patterns established in the authentication module, where route handlers and services are tested against in-memory models and component behaviors are validated with React Testing Library.

## Out of Scope

- Client-side or server-side PDF generation / export formatting (deferred to a dedicated export module).
- Job description comparison and tailoring algorithms (deferred to the tailoring module).
- Public sharing links or unauthenticated CV views.
- Direct Sanity Studio access for regular application users.

## Further Notes

- The project runs on Next.js 16 App Router and React 19.
- Styling uses Tailwind CSS v4 and Lucide React icons, adhering to the product's sleek dark/light aesthetic.
- The specification is published to `docs/specs/0002-cvs-module-spec.md` with corresponding implementation task issues tracked in `.scratch/cvs-module/issues/`.
