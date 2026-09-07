# Core Domain Model

## Organization

Top-level tenant boundary. Customers, users, leads, projects, and operational records are scoped to an organization.

## Customer

A customer represents the business or person receiving agency services. A customer can have multiple contacts and projects.

## Lead

A potential customer entering the agency funnel. Lead lifecycle:

```text
NEW → QUALIFYING → QUALIFIED → CONVERTED
                  └──────────→ DISQUALIFIED
```

## Requirement

A structured representation of what the customer needs. Requirements are versioned so that changes remain traceable.

Typical lifecycle:

```text
DRAFT → READY_FOR_REVIEW → APPROVED
              ↓
      CHANGES_REQUESTED
```

An approved requirement version becomes the authoritative input for proposal and production workflows.

## Project

A delivery unit created from approved requirements. Lifecycle:

```text
DRAFT → REQUIREMENTS_READY → PROPOSED → APPROVED
→ PLANNING → IN_PROGRESS → QA → READY_FOR_DELIVERY → DELIVERED
```

## Approval

An explicit decision record connected to a high-impact action. Approval records contain the decision, actor, timestamp, target, and relevant version/reference information.

## Workflow Run

A durable execution record for asynchronous agency processes. Workflow steps are independently observable and retryable according to policy.

## Document / Artifact

Documents describe business outputs such as requirements or proposals. Artifacts represent generated files or production outputs stored outside the transactional database when appropriate.

## Audit Log

Append-oriented record of important actions and security-sensitive changes. Audit records are not the source of truth for business state; they explain how state changed.

## Model Run

A record of an AI invocation, including provider/model metadata, usage information, correlation identifiers, and references to the related workflow. Sensitive prompt/response content should only be persisted when policy permits.

## Domain Invariants

1. Every tenant-scoped entity belongs to exactly one organization.
2. Lifecycle transitions must be explicitly allowed.
3. Requirements cannot be approved without a valid version.
4. A project cannot enter production planning without approved requirements.
5. High-impact actions require an approval record unless an explicit policy says otherwise.
6. AI-generated data must be validated before becoming authoritative domain state.
7. Cross-module changes must preserve auditability.
