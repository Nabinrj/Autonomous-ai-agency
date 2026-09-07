# System Architecture

**Document ID:** ARCH-001  
**Status:** Baseline  
**Version:** 1.0  

## 1. Architecture Goal

Build a reliable automation platform in which business workflows are composed from explicit modules, durable jobs, AI capabilities, and external integrations.

The architecture must support increasing autonomy without giving an AI component unrestricted authority over the entire system.

## 2. Logical Layers

```text
Presentation
    ↓
API / Application
    ↓
Domain Modules
    ↓
Persistence + Integration Interfaces
    ↓
Infrastructure

Async path:
API → Queue/Workflow → Worker → Domain/Integration → Event → Persistence

AI path:
Workflow → AI Provider → Structured Output → Validation → Domain Action
```

## 3. Core Modules

### Identity & Access
Owns users, roles, permissions, sessions, and authorization decisions.

### CRM
Owns organizations, customers, contacts, and lead lifecycle.

### Conversations
Owns customer communication state and messages.

### Marketing
Owns campaigns, content drafts, media assets, schedules, publications, and engagement signals.

### Requirements
Owns requirement versions, questions, answers, conflicts, confidence, and approval state.

### Projects
Owns projects, scope, milestones, tasks, status, and project lifecycle.

### Documents
Owns document templates, generated document metadata, versions, and artifact references.

### Workflow
Owns workflow definitions, runs, steps, retries, approvals, and execution state.

### AI
Owns provider adapters, model configuration, structured-generation helpers, embeddings, and AI execution metadata. It does not own business truth.

### Production
Owns generated-project build requests, isolated execution, artifacts, and build results.

### QA
Owns test execution, quality gates, findings, and validation evidence.

### Delivery
Owns packaging, deployment requests, delivery status, and customer handoff.

### Notifications
Owns notification templates, delivery requests, status, retries, and provider results.

### Audit
Owns security-sensitive and business-critical action records.

## 4. Dependency Rules

The following rules are mandatory:

1. Presentation may call application services/API endpoints, not database internals.
2. Domain modules must not import another module's private implementation.
3. External SDKs belong in integration adapters.
4. AI provider SDKs belong behind the AI provider interface.
5. Database access belongs behind repositories/data-access modules.
6. Workers invoke application/domain capabilities rather than duplicating business rules.
7. Audit events are emitted by important state-changing operations.
8. No module may bypass authorization because a request came from an internal worker.

## 5. Synchronous vs Asynchronous Work

Use synchronous API calls for short operations such as reading a lead or updating a profile.

Use asynchronous workflows for:

- social publishing
- scheduled content
- AI conversations that require multiple stages
- document generation
- project generation
- builds
- automated testing
- deployment
- bulk notifications

## 6. Source of Truth

PostgreSQL is the primary source of truth for business and workflow state.

Redis is a coordination/performance component, not the authoritative source for customer or project state.

Object storage is authoritative for binary artifacts but PostgreSQL stores their metadata and relationships.

## 7. Trust Boundaries

```text
TRUSTED
├── Core API
├── Database
├── Approved configuration
└── Controlled workers

RESTRICTED
├── AI providers
├── Social APIs
├── Email providers
└── Customer-supplied content

UNTRUSTED / ISOLATED
└── AI-generated source code and build processes
```

Crossing a trust boundary requires validation and least-privilege credentials.

## 8. Request Correlation

Every important request/workflow should carry a correlation context:

```text
request_id
workflow_id
actor_id
customer_id
project_id
job_id
```

This allows operators to reconstruct what happened without relying on scattered log messages.

## 9. Failure Isolation

A failed external integration must not erase or corrupt the internal business record.

A failed AI generation must produce a recoverable workflow state.

A failed generated-code build must remain isolated from the main API and production environment.

## 10. Evolution Strategy

Start as a modular monolith plus workers. Extract a module into a service only when measured scaling, security, reliability, ownership, or runtime requirements justify the additional operational complexity.
