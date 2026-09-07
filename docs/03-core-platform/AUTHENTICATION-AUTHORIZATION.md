# Authentication & Authorization

## Authentication

The production authentication provider remains an explicit integration decision. The backend therefore exposes an internal authentication boundary rather than coupling business modules to a provider SDK.

The authentication layer must resolve an authenticated principal into:

```text
userId
organizationId
roles
permissions
```

No production endpoint may trust a client-supplied user or organization identifier as proof of identity.

## Authorization

Authorization follows:

```text
Authenticated Principal
        ↓
Organization Boundary
        ↓
Permission Check
        ↓
Resource Ownership / Scope Check
        ↓
Domain Action
```

Example permissions:

- `customer.read`
- `customer.write`
- `lead.read`
- `lead.write`
- `requirements.read`
- `requirements.write`
- `requirements.approve`
- `project.read`
- `project.write`
- `project.approve`
- `workflow.read`
- `workflow.execute`
- `audit.read`

## Roles

The initial role model is:

| Role | Purpose |
|---|---|
| OWNER | Full organization control |
| ADMIN | Operational administration |
| OPERATOR | Day-to-day agency operations |
| REVIEWER | Reviews and approvals |
| CUSTOMER | Customer-scoped access |
| SYSTEM | Internal trusted service identity |

Roles map to permissions in PostgreSQL seed data. A role is not itself an authorization decision: resource scope and lifecycle policy still apply.

## Approval Security

AI agents cannot approve their own generated proposals, production deployments, destructive operations, or final delivery. Human approval remains the default gate for high-impact actions until a separately measured automation policy permits otherwise.

## Development Mode

Local development may use a clearly marked mock principal so the application can be exercised without a production identity provider. This mechanism must be disabled or rejected when `NODE_ENV=production`.

## Security Requirements

- deny by default;
- least privilege;
- organization isolation on every tenant-scoped query;
- no secrets in source control;
- audit sensitive actions;
- validate all external identity claims;
- never use AI output as an authorization decision;
- test both allowed and denied paths.
