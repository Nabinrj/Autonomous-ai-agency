# API Architecture

## 1. Purpose

This document defines the HTTP API conventions for the Autonomous AI Agency. The API is the stable application boundary between the web interface, automation workers, integrations, and future external clients.

## 2. API principles

- Version public APIs from the beginning (`/api/v1`).
- Return predictable JSON envelopes.
- Validate every request at the boundary.
- Never trust AI-generated identifiers, permissions, or state transitions.
- Use database IDs as opaque UUIDs.
- Use idempotency keys for retryable commands that can create side effects.
- Long-running work returns a workflow/job reference rather than blocking an HTTP request.
- Sensitive fields are minimized in responses and logs.
- Authorization is enforced server-side for every protected resource.

## 3. Base URL

Development:

```text
http://localhost:3000/api/v1
```

Production will use the deployed API hostname behind TLS.

## 4. Response envelope

Successful single-resource response:

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid"
  }
}
```

Collection response:

```json
{
  "data": [],
  "meta": {
    "request_id": "uuid",
    "page": 1,
    "page_size": 25,
    "total": 100
  }
}
```

Error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "details": []
  },
  "meta": {
    "request_id": "uuid"
  }
}
```

## 5. HTTP conventions

| Operation | Method | Example |
|---|---|---|
| Create | POST | `/leads` |
| List | GET | `/leads` |
| Read | GET | `/leads/{id}` |
| Replace/update | PATCH | `/leads/{id}` |
| Delete/archive | DELETE | `/leads/{id}` |
| Command | POST | `/leads/{id}/qualify` |
| Start workflow | POST | `/workflows/requirements` |

Deletion of business records should normally be an archive/state transition rather than physical deletion. Destructive operations require explicit authorization.

## 6. Core API surface

### Health

- `GET /health`
- `GET /ready`

`/health` checks process health. `/ready` checks whether required dependencies are available for serving traffic.

### Authentication and identity

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/refresh` when token refresh is used.

Authentication implementation is provider/configuration dependent; business modules must not implement their own credential logic.

### Customers

- `POST /customers`
- `GET /customers`
- `GET /customers/{customer_id}`
- `PATCH /customers/{customer_id}`
- `GET /customers/{customer_id}/projects`
- `GET /customers/{customer_id}/conversations`

### Leads

- `POST /leads`
- `GET /leads`
- `GET /leads/{lead_id}`
- `PATCH /leads/{lead_id}`
- `POST /leads/{lead_id}/qualify`
- `POST /leads/{lead_id}/convert`

### Conversations

- `POST /conversations`
- `GET /conversations/{conversation_id}`
- `GET /conversations/{conversation_id}/messages`
- `POST /conversations/{conversation_id}/messages`
- `POST /conversations/{conversation_id}/summarize`

AI responses are generated asynchronously when practical. Customer-facing messages must pass policy, schema, and authorization checks before publication.

### Requirements

- `POST /requirements`
- `GET /requirements/{requirement_id}`
- `POST /requirements/{requirement_id}/versions`
- `POST /requirements/{requirement_id}/validate`
- `POST /requirements/{requirement_id}/approve`
- `POST /requirements/{requirement_id}/request-changes`

### Projects

- `POST /projects`
- `GET /projects`
- `GET /projects/{project_id}`
- `PATCH /projects/{project_id}`
- `GET /projects/{project_id}/tasks`
- `POST /projects/{project_id}/tasks`
- `POST /projects/{project_id}/start`

### Approvals

- `GET /approvals`
- `GET /approvals/{approval_id}`
- `POST /approvals/{approval_id}/approve`
- `POST /approvals/{approval_id}/reject`

### Workflows

- `POST /workflows/requirements`
- `POST /workflows/production`
- `GET /workflows/{workflow_run_id}`
- `GET /workflows/{workflow_run_id}/steps`
- `POST /workflows/{workflow_run_id}/cancel`

## 7. Query and pagination

Collections support:

```text
?page=1&page_size=25&sort=-created_at&status=QUALIFIED
```

Maximum page size is enforced server-side. Cursor pagination may be introduced for high-volume event or message feeds.

## 8. Idempotency

Side-effecting commands should accept:

```text
Idempotency-Key: <client-generated-key>
```

The server stores the key and resulting operation reference for a bounded retention period. A repeated request with the same key must not repeat the external side effect.

## 9. Request correlation

Every request receives or propagates an `X-Request-ID`. The identifier is included in structured logs, workflow metadata, and error responses.

## 10. Authorization

Authorization is based on authenticated identity plus role/permission checks. Typical roles include:

- `OWNER`
- `ADMIN`
- `OPERATOR`
- `REVIEWER`
- `CUSTOMER`
- `SYSTEM`

The API must apply least privilege and object-level access checks. A valid login alone does not grant access to arbitrary customer or project IDs.

## 11. AI-specific API rules

AI endpoints must expose the operation being performed rather than exposing provider-specific SDK details. For example:

```text
POST /requirements/{id}/validate
```

is preferred over:

```text
POST /openai/generate
```

The API records model/provider metadata internally when relevant for audit, cost, and evaluation.

## 12. Long-running operations

Builds, document generation, social publishing, bulk imports, and other long-running actions return `202 Accepted` with a workflow reference when they cannot complete safely within a normal HTTP request.

Example:

```json
{
  "data": {
    "workflow_run_id": "uuid",
    "status": "STARTED"
  },
  "meta": {
    "request_id": "uuid"
  }
}
```

## 13. State transition enforcement

Clients cannot directly set arbitrary state values. State-changing endpoints invoke domain commands that verify the current state and required preconditions.

Example:

```text
DRAFT -> REQUIREMENTS_READY -> PROPOSED -> APPROVED
```

A request attempting `DRAFT -> DELIVERED` must be rejected.

## 14. Security requirements

- TLS in production.
- Strict CORS allowlist.
- Rate limiting on public and authentication endpoints.
- Request-body size limits.
- Schema validation for every external input.
- Secrets only from environment/secret manager.
- No credentials in URLs.
- No sensitive data in logs by default.
- Audit all privileged commands.

## 15. API evolution

Breaking changes require a new API version or an explicit migration strategy. Additive response fields are preferred. Deprecated endpoints must have documented removal timelines.

## 16. Contract testing

The API contract becomes testable documentation. CI should validate:

1. Request schemas.
2. Response schemas.
3. Authentication behavior.
4. Authorization behavior.
5. State-transition rules.
6. Idempotency behavior.
7. Error envelope consistency.

## 17. Initial implementation priority

P0:

- Health/readiness.
- Authentication boundary.
- Customers.
- Leads.
- Requirements.
- Projects.
- Approvals.
- Workflow status.

P1:

- Conversations.
- Documents.
- Notifications.
- Audit query APIs.

P2:

- Advanced analytics.
- External client API keys.
- Webhooks for selected integrations.
