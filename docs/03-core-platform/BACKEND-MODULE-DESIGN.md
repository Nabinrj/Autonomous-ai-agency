# Backend Module Design

## 1. Module Layout

```text
backend/src/
├── common/
│   ├── errors/
│   ├── http/
│   └── types/
├── config/
├── infrastructure/
│   └── database/
├── modules/
│   ├── auth/
│   ├── customers/
│   ├── leads/
│   ├── requirements/
│   ├── projects/
│   ├── approvals/
│   └── audit/
├── app.ts
└── server.ts
```

## 2. Standard Module Shape

A business module should normally contain:

```text
<module>/
├── <entity>.types.ts
├── <entity>.schema.ts
├── <entity>.repository.ts
├── <entity>.service.ts
├── <entity>.routes.ts
└── index.ts
```

Responsibilities:

- `types.ts`: domain/application types and lifecycle values.
- `schema.ts`: runtime validation for API input/output boundaries.
- `repository.ts`: persistence contract and SQL-backed implementation boundary.
- `service.ts`: business rules, authorization checks, and state transitions.
- `routes.ts`: HTTP mapping only; no business logic.
- `index.ts`: module registration/composition.

## 3. Dependency Rules

```text
HTTP Route
   ↓
Application Service
   ↓
Repository Interface
   ↓
Infrastructure / PostgreSQL
```

A service may depend on another module's public service/interface when a business workflow requires it, but it must not reach into another module's tables directly.

## 4. Lifecycle Ownership

- Leads own lead status transitions.
- Requirements own requirement-version and requirement status transitions.
- Projects own project status transitions.
- Approvals own approval decisions.
- Audit owns audit records.
- Auth owns authorization policy evaluation, but individual modules still declare the permissions they require.

## 5. Request Context

Every request should eventually resolve to a context containing at least:

- request ID
- authenticated user ID
- organization ID
- roles/permissions
- correlation ID

Development-only fallback identity must never be accepted as a production authentication mechanism.

## 6. Persistence Rules

Repositories must:

- use parameterized SQL;
- preserve organization boundaries;
- expose domain-oriented operations rather than arbitrary SQL;
- support transactions when a state change and its audit event must be atomic;
- avoid leaking database-specific records into HTTP responses.

## 7. Testing Strategy

Pure service tests use in-memory repository implementations. Integration tests use PostgreSQL. API tests verify validation, authorization, response envelopes, and lifecycle behavior.

## 8. Error Strategy

Expected business failures use typed application errors and stable error codes. Unexpected failures are logged with correlation/request IDs and return a generic server error to clients.
