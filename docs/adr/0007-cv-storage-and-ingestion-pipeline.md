# CV Storage and Asynchronous Ingestion Pipeline

## Context
Users provide raw text, PDF, or DOCX documents that must be converted into ATS-friendly structured CVs. We needed to decide how CV documents are stored, scoped to authenticated users, processed in the background, and structured via Sanity's AI capabilities without incurring memory overhead or compromising multi-tenant security.

## Decision
1. **Multi-Tenancy & Storage Boundary**: CV documents are stored directly in Sanity CMS (`_type: "cv"`) with an indexed `userId` string field matching the Better Auth `user.id`. The public client never queries user CVs; all mutations and reads are mediated via server-side Next.js route handlers enforcing user ownership.
2. **In-Memory Text Extraction**: PDF and DOCX files are parsed in server memory with a strict 5 MB payload limit. Original binary files are discarded after text extraction; the unformatted `rawText` is persisted on the Sanity CV document for auditability and re-prompting.
3. **Asynchronous Execution & State Machine**: Ingestion creates a Sanity document with `ingestionStatus: "extracting"`, schedules extraction and structuring in a Next.js `after()` background handler, and returns immediately so the client can poll status.
4. **Sanity Agent Actions for Structuring**: Structured section extraction is performed headlessly via Sanity Agent Actions, ensuring output strictly adheres to the Sanity schema types.
5. **Hybrid Modular Schema**: CV documents consist of standard root identity fields (`personalInfo`, `summary`) and a polymorphic, ordered array of reorderable section blocks (`workExperience`, `education`, `skills`, `projects`, `certifications`, `languages`, `custom`).

## Consequences
- No database migrations needed for CV structures; Sanity schema defines document validation.
- Zero external queue infrastructure needed for initial background processing.
- Memory consumption during file ingestion remains under 30 MB per request.
- Soft failures retain `rawText`, allowing one-click retry or manual editing.
