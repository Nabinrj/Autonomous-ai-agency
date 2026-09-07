# 03 — Core Platform

This stage turns the architecture into the first working application platform.

## Purpose

The Core Platform provides the backend foundations required by every later agency capability:

- Authentication boundary and role-based authorization
- Customer and organization management
- Lead lifecycle management
- Structured requirements and versioning
- Project lifecycle management
- Approval gates
- Auditability
- PostgreSQL persistence
- Consistent HTTP/API behavior

## Implementation Principles

1. **Modular monolith first** — modules have explicit ownership and stable boundaries.
2. **Database is the source of truth** — PostgreSQL owns transactional state.
3. **AI is not an authority** — AI output is treated as untrusted input and must pass validation and policy checks.
4. **State transitions are enforced in application services** — routes do not directly mutate lifecycle state.
5. **Authorization is explicit** — every protected operation requires an authenticated identity and permission check in production.
6. **Repositories isolate persistence** — business logic does not depend directly on SQL or Fastify request objects.
7. **Tests do not require infrastructure** — core state-machine behavior is testable with in-memory repositories.

## Core Modules

| Module | Owns | Initial capability |
|---|---|---|
| Auth | Identity context and authorization policies | Permission checks and auth boundary |
| Customers | Organizations, customers, contacts | Customer CRUD |
| Leads | Lead lifecycle | Create, qualify, convert |
| Requirements | Requirement versions and approval state | Create, version, validate, approve |
| Projects | Project/task lifecycle | Create and controlled progression |
| Approvals | Human approval decisions | Create, approve, reject |
| Audit | Immutable activity record | Append audit events |

## Stage Exit Criteria

The stage is complete when the backend can persist and expose the core entities, enforce lifecycle rules, apply RBAC at the application boundary, record important actions, and pass automated tests without requiring a live external AI provider.

## Related Architecture

- `docs/02-architecture/SYSTEM-ARCHITECTURE.md`
- `docs/02-architecture/MODULE-BOUNDARIES.md`
- `docs/02-architecture/API-ARCHITECTURE.md`
- `docs/02-architecture/DATABASE-ERD.md`
- `docs/02-architecture/SECURITY-ARCHITECTURE.md`
