# SanityCV — Tailoring Web Application

Domain model and glossary for SanityCV, an intelligent CV tailoring web application powered by Sanity CMS and local SQLite identity persistence.

## Language

**User**:
An individual identity registered in the application.
_Avoid_: Member, Customer, Client, Profile

**Session**:
An active, time-bounded authenticated connection between a client and a User.
_Avoid_: Token, Login state, Connection

**Account**:
A specific authentication credential or identity method associated with a User.
_Avoid_: User account, Login credential

**Role**:
An authorization categorization assigned to a User governing application privileges (e.g., `user`, `admin`).
_Avoid_: Permission, Group, Tier

**Admin**:
A User assigned the administrative Role with privileges to inspect and manage user states.
_Avoid_: Superuser, Moderator

**Active Session**:
A valid, non-expired Session currently authenticated on a specific device or browser that can be individually inspected or revoked.
_Avoid_: Device token, Login instance

**CV**:
The primary professional record belonging to a User, containing personal identity information and an ordered sequence of CV Sections.
_Avoid_: Resume document, Curriculum, Bio

**Source Document**:
The original input provided by a User for ingestion, either as raw text or an uploaded file (PDF or DOCX).
_Avoid_: Upload, File input, Attachment

**Raw Text**:
The plain, unformatted textual content extracted from a Source Document prior to semantic structuring.
_Avoid_: Extracted dump, String content

**Structured CV**:
The validated, schema-compliant representation of a CV where information has been parsed into distinct semantic fields and sections.
_Avoid_: Parsed resume, Final output

**CV Section**:
A modular, ordered component within a CV representing a specific facet of a User's background (e.g., Work Experience, Education, Skills, Projects).
_Avoid_: Category, Block, Segment

**Ingestion Status**:
The lifecycle stage of a CV during ingestion and structuring (`pending`, `extracting`, `structuring`, `ready`, `failed`).
_Avoid_: Job state, Progress tracker

**Primary CV**:
A designated CV chosen by the User to serve as their baseline or default profile for job tailoring workflows.
_Avoid_: Master CV, Main resume, Default CV


