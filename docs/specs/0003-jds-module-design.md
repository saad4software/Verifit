# JD module — agreed design

This document consolidates the decisions accepted during the design interview. The User confirmed the complete design on 2026-09-20. It is the agreed product design, not yet a technical implementation specification.

## Agreed scope

- Accept pasted text or a web page URL describing a job opportunity.
- Support extraction, review, editing, and saving a structured JD. CV matching belongs to a later release.
- JDs are private and owned by the submitting User. Each JD exists independently of any CV and can later be compared against multiple CVs.
- Extract only claims supported by the ad and preserve supporting excerpts. Distinguish required, preferred, and unspecified requirements. Missing information means not stated; preserve alternatives such as a degree or equivalent experience.
- Use the existing agent client for semantic extraction and structuring.
- URL import is best effort: retrieve the page, prefer embedded JobPosting data, and fall back to main-content extraction with Mozilla Readability. Pass resulting text to the agent client. Offer pasted text when URL extraction fails. Automatic browser rendering and paid extraction services are outside the initial approach.

## Agreed structured content

- Capture job title, company, responsibilities, seniority, skills, experience, education, certifications, languages, location, work arrangement, employment type, compensation, and explicitly stated eligibility constraints. Leave unstated fields empty.
- Represent qualifications individually with classification and supporting excerpts. Preserve alternative qualifications and nested experience requirements: five years overall including two in React does not mean seven years.
- Preserve the ad's language and original excerpts while using consistent internal categories. Translation and cross-language skill normalization are deferred to matching work.

## Agreed review and management

- Save extracted JDs automatically as needs review. Present editable fields alongside source text; explicit user confirmation makes the JD ready for future matching.
- Accept incomplete descriptions with missing-information warnings. Reject clearly unrelated content. Ask for a single ad when input describes multiple distinct jobs.
- Retain submitted or imported text and the source URL when supplied. Retry structuring from retained text.
- Reprocessing produces a proposed replacement for user review before replacing edits. Refetching a URL requires an explicit user action because an ad may have changed.
- Support listing, viewing, editing, deleting, and retrying failed imports.
- Warn on repeat imports of the same URL by the same User, offering to open the existing JD or create a separate copy. Imports remain independent between Users.

## Corrections and replacement review

- Manual corrections must remain faithful to the ad. Users can correct fields and supporting excerpts; unsupported additions are flagged and must be resolved before the JD becomes ready. Personal matching preferences are outside this module's initial scope.
- Saving manual content edits returns a ready JD to needs review. Offer a Save and confirm shortcut subject to the same readiness checks.
- Reprocessing preserves the existing ready version while a replacement is pending. Accepting the replacement confirms it as ready; rejecting it preserves existing content.
- Retain current source text and structured content plus at most one pending replacement with its own source. Accepting a replacement swaps source and structured content together. Full version history is deferred.
- Deleting a JD also removes its retained source and pending replacement, with confirmation in the UI.

## Import limits and recovery

- Accept one ad per submission, with a maximum of 50,000 characters of pasted or extracted text. Explain oversized input instead of silently truncating it.
- Show processing progress and actionable failure messages. Interrupted processing must eventually become retryable rather than remain stuck.
- When a URL is inaccessible, offer pasted text within the same import.

## Confirmation summary

The initial module captures one private job opportunity, structures only source-supported information through the existing agent client, and requires user review before readiness for future matching. URL retrieval and text extraction precede semantic structuring. Corrections and replacements preserve the relationship between content and its source, and failed imports have a recovery path.

All product questions raised in this interview are resolved, and the complete design is confirmed. Technical implementation details will be specified against the repository's conventions.

## URL extraction references

- [Schema.org JobPosting](https://schema.org/JobPosting)
- [Mozilla Readability](https://github.com/mozilla/readability)
