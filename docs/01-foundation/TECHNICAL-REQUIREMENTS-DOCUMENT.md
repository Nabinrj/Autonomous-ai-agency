# Technical Requirements Document (TRD)

**Project:** Autonomous AI Agency  
**Document ID:** TRD-001  
**Version:** 1.0  
**Status:** Proposed / Architecture Baseline  
**Owner:** Project Team  
**Repository:** `Nabinrj/Autonomous-ai-agency`  
**Last Updated:** 2026-09-07  

---

## 1. Purpose

This document defines the technical requirements and initial technology architecture for the Autonomous AI Agency platform.

The system is intended to automate a complete software-agency workflow: marketing, lead capture, customer communication, requirement gathering, project planning, AI-assisted production, testing, delivery, notifications, and operational monitoring.

The TRD is an engineering baseline. Individual technologies may be replaced later through documented architecture decisions, but interfaces and system contracts must remain stable wherever practical.

---

## 2. Technical Objectives

The platform shall:

1. Provide a modular and maintainable architecture.
2. Separate deterministic business logic from AI-generated reasoning.
3. Support asynchronous and long-running workflows.
4. Store business and workflow state reliably.
5. Integrate with external services through adapters.
6. Validate AI-generated structured output before execution.
7. Isolate generated code from the main application and production environment.
8. Provide authentication, authorization, auditability, and observability.
9. Support development, staging, and production environments.
10. Allow new AI models and external providers to be added without rewriting the whole system.
11. Make failures recoverable through retries, idempotency, checkpoints, and human approval gates.
12. Keep the architecture suitable for gradual automation rather than requiring full autonomy on day one.

---

## 3. Architecture Principles

### 3.1 Modular by responsibility

Each major business capability should have a clear boundary. Marketing, CRM, requirements, documents, production, QA, notifications, and integrations must not become one large codebase with hidden dependencies.

### 3.2 API-first

Core capabilities should be exposed through well-defined internal APIs or service interfaces so that the web dashboard, workers, agents, and future clients can reuse them.

### 3.3 Event-driven where useful

Long-running operations such as publishing, AI processing, testing, deployment, and notifications should not depend on a single synchronous HTTP request remaining open.

### 3.4 AI is not the source of truth

AI may propose classifications, plans, text, code, or decisions. The platform remains responsible for validating those outputs against schemas, permissions, business rules, tests, and approval requirements.

### 3.5 Least privilege

Every service, worker, agent, and integration receives only the permissions required for its job.

### 3.6 Observable by default

Important workflow transitions, external calls, failures, approvals, generated artifacts, and deployment actions must be traceable.

### 3.7 Provider abstraction

LLM providers, email providers, social networks, object storage, and other third-party services should be accessed through adapters rather than being deeply coupled to business logic.

---

## 4. Proposed System Architecture

```text
                           ┌──────────────────────┐
                           │   React Web Console   │
                           │ Admin / Operations UI │
                           └──────────┬───────────┘
                                      │ HTTPS
                                      ▼
                           ┌──────────────────────┐
                           │   Node.js API Layer  │
                           │ TypeScript + Auth    │
                           └───────┬───────┬──────┘
                                   │       │
                     ┌─────────────┘       └──────────────┐
                     ▼                                    ▼
              ┌──────────────┐                    ┌────────────────┐
              │ PostgreSQL   │                    │ Redis / Queue  │
              │ Source State │                    │ Async Jobs     │
              └──────────────┘                    └───────┬────────┘
                                                          │
                                                          ▼
                                             ┌────────────────────────┐
                                             │ Workflow / Worker Layer │
                                             │ Orchestration + Jobs    │
                                             └───────┬─────────┬──────┘
                                                     │         │
                                      ┌──────────────┘         └──────────────┐
                                      ▼                                       ▼
                             ┌────────────────┐                    ┌────────────────┐
                             │ AI / Agent     │                    │ Integration    │
                             │ Services       │                    │ Adapters       │
                             └───────┬────────┘                    └───────┬────────┘
                                     │                                     │
                           ┌─────────┴──────────┐             ┌────────────┼─────────────┐
                           ▼                    ▼             ▼            ▼             ▼
                     ┌──────────┐        ┌──────────┐   Social APIs   Email APIs   Other APIs
                     │ LLM APIs │        │ Vector DB│
                     └──────────┘        └──────────┘

                         Generated-code execution
                                  │
                                  ▼
                       ┌────────────────────────┐
                       │ Isolated Build Sandbox │
                       │ Containers / CI Runner │
                       └───────────┬────────────┘
                                   │
                         validated artifact only
                                   ▼
                       ┌────────────────────────┐
                       │ Deployment Environment │
                       └────────────────────────┘
```

This is a logical architecture, not a requirement that every box become a separate microservice. The initial implementation should prefer a modular monolith plus workers where that reduces operational complexity.

---

## 5. Technology Baseline

| Layer | Proposed Technology | Requirement Level | Rationale |
|---|---|---:|---|
| Backend | Node.js + TypeScript | P0 | Strong API ecosystem and suitable for I/O-heavy automation |
| API framework | Fastify or NestJS | P0 | Structured server-side development |
| Frontend | React + TypeScript | P0 | Mature dashboard ecosystem |
| Styling | Tailwind CSS | P1 | Consistent and responsive UI development |
| Database | PostgreSQL | P0 | Relational integrity for business/workflow data |
| Queue/cache | Redis | P0 | Background jobs, locks, caching, rate coordination |
| Workflow | Temporal or equivalent durable workflow engine | P1 | Long-running, retryable, stateful workflows |
| Validation | Zod / JSON Schema | P0 | Validate API and AI-generated structured data |
| AI abstraction | Provider-neutral TypeScript interface | P0 | Avoid vendor lock-in |
| Vector database | Qdrant or equivalent | P1 | RAG and semantic knowledge retrieval |
| Object storage | S3-compatible storage | P1 | Documents, artifacts, exports, generated files |
| Email | Transactional email API/provider | P0 | Customer and owner notifications |
| Containers | Docker | P0 | Reproducible environments and sandboxing |
| CI/CD | GitHub Actions | P0 | Automated testing and delivery |
| Observability | Structured logs + metrics + OpenTelemetry-compatible tracing | P1 | Debugging and operational visibility |
| Reverse proxy | Nginx / managed ingress | P1 | TLS termination and routing |

These are proposed baseline decisions. Final provider selections must be recorded in architecture decision records (ADRs).

---

## 6. Backend Requirements

### TR-BE-001 API server

The backend shall expose versioned HTTP APIs for authentication, customers, leads, campaigns, requirements, projects, documents, approvals, workflows, notifications, and administration.

### TR-BE-002 Type safety

Backend application code shall use TypeScript with strict compiler settings enabled.

### TR-BE-003 Layer separation

Backend modules should separate:

- HTTP/controllers
- request validation
- application services
- domain/business rules
- persistence/repositories
- external integrations
- background jobs

### TR-BE-004 Error handling

Errors must use consistent machine-readable error codes and human-readable messages. Sensitive internal details must not be exposed to clients.

### TR-BE-005 Idempotency

Operations that can be retried must use idempotency keys or equivalent mechanisms where duplicate execution could cause harm.

### TR-BE-006 API versioning

Breaking API changes shall use explicit versioning or a documented migration strategy.

---

## 7. Frontend Requirements

The initial frontend is an operations/admin console rather than a public consumer application.

### Required areas

- Dashboard
- Leads
- Customers
- Conversations
- Requirements
- Projects
- Tasks
- Documents
- Approvals
- Campaigns
- Integrations
- Workflow runs
- Notifications
- Audit logs
- System health

### Frontend requirements

1. Responsive layout for desktop and tablet.
2. Role-aware navigation.
3. Loading, empty, error, and success states for every major operation.
4. Confirmation before irreversible actions.
5. Human-readable workflow status.
6. Links from high-level records to related events and artifacts.
7. No secrets embedded in browser code.
8. API calls must use authenticated sessions/tokens according to the selected auth design.

---

## 8. Database Requirements

### 8.1 PostgreSQL as primary system of record

PostgreSQL should store transactional business data because the platform contains strongly related entities and state transitions.

Initial logical entities include:

- users
- roles
- permissions
- organizations
- customers
- customer_contacts
- leads
- conversations
- conversation_messages
- campaigns
- social_accounts
- social_posts
- requirements
- requirement_items
- projects
- project_tasks
- approvals
- workflow_runs
- workflow_steps
- documents
- artifacts
- notifications
- integration_accounts
- audit_logs
- model_runs
- test_runs
- deployment_runs

### 8.2 Data rules

- Use UUIDs or another documented non-sequential public identifier strategy.
- Store timestamps in UTC.
- Add created/updated timestamps to mutable records.
- Use foreign keys for relational integrity.
- Use indexes based on actual query patterns.
- Use migrations for schema changes.
- Never modify production schema manually without a controlled migration process.

### 8.3 Sensitive data

Secrets and credentials must not be stored as plain text in normal business tables. Where credential persistence is necessary, use a secrets-management strategy and encryption at rest.

---

## 9. Authentication and Authorization

### Authentication

The platform shall support secure authentication for human users. The exact implementation may use a managed identity provider or an application-owned authentication module.

### Authorization

Role-Based Access Control (RBAC) is required.

Initial roles:

- `owner`
- `admin`
- `operator`
- `reviewer`
- `developer`
- `customer`

Permissions should be capability-based, for example:

- `lead.read`
- `lead.update`
- `campaign.publish`
- `requirement.approve`
- `project.manage`
- `deployment.approve`
- `audit.read`

Authorization must be checked server-side. Hiding a UI button is not an authorization mechanism.

---

## 10. AI / LLM Layer

### 10.1 Provider abstraction

The platform shall define a common AI interface so business workflows do not directly depend on one vendor SDK.

Example conceptual interface:

```text
AIProvider
├── generateText()
├── generateStructured()
├── embed()
└── moderate()
```

Provider adapters may then implement OpenAI, Groq, Anthropic, local models, or other supported providers as required.

### 10.2 Structured generation

Whenever AI output feeds another automated component, structured output must be preferred over free-form text.

Example:

```json
{
  "project_type": "website",
  "features": [],
  "constraints": [],
  "questions_remaining": [],
  "confidence": 0.0
}
```

The structure must be validated before storage or execution.

### 10.3 AI execution record

Each important model invocation should record:

- provider
- model
- workflow/run ID
- purpose
- input reference or safe prompt metadata
- output reference
- latency
- token/usage information where available
- validation result
- error information

Do not log secrets or unnecessary personal data.

### 10.4 Prompt management

Prompts should be version-controlled under `/prompts` and identified by stable names and versions.

---

## 11. Agent Architecture

Agents shall not receive unrestricted access to the entire system.

Each agent should have:

- a defined role
- allowed tools
- input schema
- output schema
- timeout
- retry policy
- maximum iteration/step budget
- authorization scope
- audit events
- failure behavior

Initial logical agents:

1. Marketing Agent
2. Lead Qualification Agent
3. Customer Conversation Agent
4. Requirement Analyst Agent
5. Project Planner Agent
6. Document Agent
7. Software Production Agent
8. QA Agent
9. Deployment Agent
10. Notification Agent

These are logical roles. They may initially run inside shared worker processes instead of separate services.

---

## 12. Workflow Orchestration

The platform requires durable workflow execution because many operations may last minutes or hours and may depend on external systems or human approvals.

### Required workflow capabilities

- start workflow
- pause/wait
- resume
- retry
- timeout
- cancellation
- approval wait state
- compensation/recovery
- checkpointing
- execution history
- idempotency
- correlation IDs

### Initial workflow

```text
Lead
 ↓
Qualification
 ↓
Customer Conversation
 ↓
Requirement Extraction
 ↓
Requirement Validation
 ↓
Document Generation
 ↓
Owner Approval
 ↓
Project Creation
 ↓
Task Planning
 ↓
AI-Assisted Build
 ↓
Automated Tests
 ↓
Quality Gate
 ↓
Delivery Approval
 ↓
Customer Delivery
```

A workflow engine such as Temporal is a strong candidate for long-running durable orchestration. A Redis-backed job system may be sufficient for early simple jobs. The final choice must be documented through an ADR after an MVP prototype.

---

## 13. External Integration Layer

External providers shall be isolated behind adapters.

Example:

```text
integrations/
├── social/
│   ├── instagram/
│   ├── facebook/
│   ├── linkedin/
│   └── other/
├── email/
├── llm/
├── storage/
└── deployment/
```

### Integration rules

1. Use official APIs and documented authentication flows.
2. Do not scrape platforms where an official supported integration should be used.
3. Store access credentials securely.
4. Implement provider-specific rate-limit handling.
5. Implement retry behavior for transient failures.
6. Record external request IDs where available.
7. Do not assume every platform supports the same publishing, messaging, or analytics capabilities.
8. Design integrations so a provider outage does not corrupt internal state.

---

## 14. Social Media Automation

The marketing subsystem shall support:

- content generation
- content review
- media asset management
- scheduling
- publishing
- publication status
- engagement retrieval where officially supported
- comment/message ingestion where officially supported
- lead signal detection

Public posting must initially use an approval gate until the workflow has demonstrated sufficient reliability.

The system must distinguish between:

- generated content
- approved content
- scheduled content
- published content
- failed publication
- withdrawn/cancelled content

---

## 15. Customer Conversation and Requirements

The conversation subsystem shall:

1. Maintain conversation state.
2. Store messages with timestamps and source.
3. Identify unanswered requirements.
4. Ask targeted follow-up questions.
5. Produce structured requirements.
6. Detect uncertainty and conflicting answers.
7. Request human review when confidence or risk is insufficient.
8. Generate a versioned requirements document.

The AI must not silently invent customer requirements. Unknown information should remain explicitly unknown until confirmed.

---

## 16. Document Generation

The platform should generate structured documents from approved data, not from an uncontrolled conversation transcript alone.

Initial document types:

- requirements specification
- project proposal
- scope summary
- implementation plan
- test report
- delivery report

Documents shall have:

- document ID
- project/customer reference
- version
- generation timestamp
- source data reference
- status
- approval information where applicable

Generated files should be stored in object storage, with metadata in PostgreSQL.

---

## 17. AI-Assisted Software Production

This subsystem is one of the highest-risk components and must be introduced gradually.

### Required pipeline

```text
Approved Requirements
        ↓
Technical Plan
        ↓
Repository Initialization
        ↓
AI Code Generation
        ↓
Static Checks
        ↓
Unit/Integration Tests
        ↓
Build
        ↓
Security Checks
        ↓
Review / Quality Gate
        ↓
Package Artifact
```

The AI production system must never directly modify a production deployment without passing the required gates.

### Generated code isolation

Generated code must execute in an isolated environment such as a disposable container or dedicated CI runner.

The sandbox should enforce, where technically supported:

- CPU limits
- memory limits
- execution timeout
- filesystem isolation
- restricted credentials
- restricted network access
- disposable workspace
- artifact size limits

Secrets from the agency's production environment must never be automatically injected into untrusted generated code.

---

## 18. Testing Requirements

Testing must exist at multiple levels.

### Required levels

1. Unit tests
2. Integration tests
3. API tests
4. Workflow tests
5. AI structured-output validation tests
6. End-to-end tests
7. Security checks
8. Build/package verification

### AI-specific testing

The platform should maintain evaluation datasets for important AI workflows, including requirement extraction, lead qualification, and document generation.

Model changes must be evaluated before being promoted to production.

---

## 19. Deployment Architecture

The system shall support at least three logical environments:

```text
Development → Staging → Production
```

### Development

Used for local implementation and experimentation.

### Staging

Production-like environment for integration and acceptance testing.

### Production

Real customer data and external integrations.

Production deployments should require successful CI checks and appropriate approval.

### Containerization

Services should be containerized where practical.

Initial deployment units may include:

- API server
- worker process
- frontend
- PostgreSQL
- Redis
- workflow engine if selected

Managed database and managed infrastructure should be preferred when they materially reduce operational risk for the early production system.

---

## 20. CI/CD Requirements

GitHub Actions shall be used initially for automated engineering checks.

Every pull request should run, as applicable:

1. dependency installation
2. formatting check
3. linting
4. TypeScript compilation
5. unit tests
6. integration tests
7. security/dependency checks
8. build verification

Deployment pipelines should promote a tested artifact rather than rebuilding different source states for each environment.

---

## 21. Observability

The platform shall provide:

- structured application logs
- workflow execution logs
- audit logs
- error tracking
- health endpoints
- basic service metrics
- external integration status

Important records should contain correlation IDs such as:

```text
request_id
workflow_id
project_id
customer_id
job_id
```

This allows an operator to trace an event across API, workflow, worker, AI, integration, and notification layers.

---

## 22. Security Requirements

### Mandatory baseline

- Secrets stored outside source control.
- Environment-specific configuration.
- HTTPS in production.
- Server-side authorization.
- Input validation.
- Output validation.
- Secure password handling if passwords are managed directly.
- Rate limiting on sensitive endpoints.
- Audit logging for privileged actions.
- Dependency vulnerability scanning.
- Secure HTTP headers where applicable.
- Protection against common injection attacks.
- Minimal access to external credentials.
- No production secrets in AI prompts.
- No unrestricted shell access for AI agents.

### Data privacy

Customer data should be collected only when necessary for the business workflow. Retention and deletion policies must be defined before handling real customer data at scale.

---

## 23. Reliability Requirements

The platform shall be designed for partial failure.

Examples:

- If an email provider fails, the project workflow should not lose the project state.
- If a social API times out, the publication job should become retryable rather than silently reporting success.
- If an AI provider fails, the workflow should record the failure and use a retry/fallback policy where appropriate.
- If a worker crashes, durable workflow state should permit recovery.

### Reliability mechanisms

- retries with exponential backoff
- timeouts
- idempotency
- dead-letter handling where appropriate
- circuit breakers where useful
- persistent workflow state
- health checks
- graceful shutdown

---

## 24. Performance Requirements

Initial targets are engineering objectives rather than guaranteed SLAs.

| Area | Initial Target |
|---|---:|
| Typical API response | < 500 ms excluding long-running external/AI jobs |
| Background job acknowledgement | < 1 s |
| Dashboard initial data request | < 2 s under normal development-scale load |
| Workflow recovery | No loss of persisted workflow state |
| Duplicate job execution | Prevented for operations requiring idempotency |

Performance targets must be measured with realistic workloads before production claims are made.

---

## 25. Configuration Management

Configuration must be separated from source code.

Example environment categories:

```text
APP_ENV
DATABASE_URL
REDIS_URL
LLM_PROVIDER
LLM_MODEL
EMAIL_PROVIDER
OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_BUCKET
AUTH_CONFIGURATION
SOCIAL_INTEGRATION_CONFIGURATION
```

Secrets must be provided through environment variables or a dedicated secrets manager. Example `.env` files may exist locally, but real secrets must never be committed.

A committed `.env.example` should document required variable names without real credentials.

---

## 26. Repository Structure

The repository shall evolve toward the following structure:

```text
Autonomous-ai-agency/
├── .github/
│   └── workflows/
├── docs/
│   ├── 01-foundation/
│   ├── 02-architecture/
│   ├── 03-backend/
│   ├── 04-frontend/
│   ├── 05-ai-system/
│   ├── 06-integrations/
│   ├── 07-data/
│   ├── 08-security/
│   ├── 09-testing/
│   ├── 10-deployment/
│   └── 11-operations/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   ├── common/
│   │   ├── config/
│   │   └── server.ts
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   ├── services/
│   │   └── types/
│   └── tests/
├── agents/
│   ├── marketing/
│   ├── qualification/
│   ├── requirements/
│   ├── planning/
│   ├── production/
│   └── qa/
├── workers/
│   ├── jobs/
│   └── workflows/
├── integrations/
│   ├── social/
│   ├── ai/
│   ├── email/
│   ├── storage/
│   └── deployment/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schemas/
├── infrastructure/
│   ├── docker/
│   ├── deployment/
│   └── monitoring/
├── prompts/
├── scripts/
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── evaluations/
├── data/
│   └── examples/
└── README.md
```

Directories may remain absent until they contain real project artifacts. Empty folders should not be created solely for appearance; use `.gitkeep` only when a planned directory must be visible in Git.

---

## 27. API Design Baseline

The API should follow resource-oriented conventions.

Example resources:

```text
/api/v1/auth
/api/v1/users
/api/v1/leads
/api/v1/customers
/api/v1/conversations
/api/v1/campaigns
/api/v1/requirements
/api/v1/projects
/api/v1/tasks
/api/v1/documents
/api/v1/approvals
/api/v1/workflows
/api/v1/notifications
/api/v1/audit-logs
```

Long-running actions should return a workflow/job reference rather than pretending the operation completed synchronously.

Example conceptual response:

```json
{
  "status": "accepted",
  "workflow_id": "workflow-uuid",
  "message": "Project generation started"
}
```

---

## 28. Logging Rules

Logs should be useful for operators and safe for customer data.

Never log:

- passwords
- API keys
- access tokens
- secret keys
- full payment credentials
- unnecessary private customer content

Prefer structured records:

```json
{
  "level": "info",
  "event": "workflow.started",
  "workflow_id": "...",
  "project_id": "...",
  "timestamp": "..."
}
```

---

## 29. Backup and Recovery

Before production use, the system must define:

- PostgreSQL backup frequency
- retention period
- restore procedure
- object-storage backup/versioning strategy
- recovery objectives
- disaster recovery owner
- periodic restore testing

A backup that has never been restored successfully must not be considered a proven recovery mechanism.

---

## 30. Technology Alternatives

| Concern | Primary Candidate | Alternative | Decision Timing |
|---|---|---|---|
| Backend | Node.js + TypeScript | Python/FastAPI | Stage 2 |
| API framework | Fastify/NestJS | Express | Stage 2 |
| Workflow | Temporal | BullMQ/custom workers | Stage 2 MVP prototype |
| Database | PostgreSQL | MySQL | Stage 2 |
| Queue | Redis | RabbitMQ | Stage 2 |
| Vector DB | Qdrant | pgvector | Stage 6 |
| Object storage | S3-compatible | Provider-native storage | Stage 7 |
| Auth | Managed IdP / secure app auth | Custom auth | Stage 3 |
| AI providers | Provider abstraction | Single provider | Stage 6 |

No alternative should be selected because it is popular alone. Decisions should be based on project requirements, operational complexity, cost, reliability, security, and team capability.

---

## 31. Non-Functional Acceptance Criteria

The architecture baseline is acceptable when:

- A developer can run the core platform locally using documented steps.
- The API can persist and retrieve core business records.
- Authentication and authorization are enforced server-side.
- Background work does not depend on an open browser request.
- AI outputs used by workflows are schema-validated.
- Workflow failures are observable and recoverable.
- Generated code runs outside the trusted application environment.
- CI can automatically test and build the application.
- Production configuration does not require committing secrets.
- Important privileged actions have audit records.
- Each external integration can fail without corrupting internal state.

---

## 32. Open Architecture Decisions

The following decisions remain open and must be resolved through ADRs/prototypes:

1. Fastify vs NestJS.
2. Temporal vs Redis-based workflow orchestration for the first production milestone.
3. Managed authentication provider vs application-owned authentication.
4. Qdrant vs PostgreSQL/pgvector for knowledge retrieval.
5. Cloud provider and hosting model.
6. Transactional email provider.
7. Object-storage provider.
8. Primary LLM provider(s).
9. Sandbox technology for generated-code execution.
10. Exact social platforms included in MVP.

Keeping these decisions open is intentional. The architecture should not lock the project into expensive infrastructure before the MVP proves the workflow.

---

## 33. Implementation Rule

The team must build the smallest complete vertical slice before implementing every planned subsystem.

The first implementation target is:

```text
API
 ↓
Database
 ↓
Lead
 ↓
Customer
 ↓
Requirement Workflow
 ↓
Structured Requirement
 ↓
Document
 ↓
Approval
```

Only after this path works reliably should the project expand into social publishing, AI production, deployment automation, and higher autonomy.

---

## 34. Traceability

Every major technical requirement should eventually map to:

```text
Requirement → Design → Code → Test → Evidence
```

This makes it possible to determine whether a feature is genuinely implemented rather than merely described in documentation.

---

## 35. Status

**TRD-001 establishes the proposed technical baseline for Stage 2 architecture work.**

The next engineering documents should convert this baseline into concrete architecture decisions, service/module boundaries, API contracts, database schema, event contracts, and local development standards.
