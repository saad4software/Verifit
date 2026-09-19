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
