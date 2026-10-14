# Core Platform Security Hardening Plan

## Objective

Harden the Stage 3 backend before adding more autonomous execution. Security controls must be enforced by the application and database, not by prompts or UI conventions.

## Priority 0 — Correctness and access control

- Standardize all route handlers on one authorization helper that accepts a nullable request context and returns the validated context.
- Fail closed when no authenticated principal exists.
- Check organization scope for every resource read and mutation; never trust organization IDs supplied by clients.
- Keep development authentication explicitly disabled outside development and fail startup if a production authentication provider is missing.
- Validate route parameters, request bodies, query strings, and environment variables with schemas.
- Return safe error responses without SQL, stack traces, credentials, or provider responses.

## Priority 1 — State and persistence integrity

- Enforce lifecycle transitions in services and protect updates against concurrent state changes.
- Use parameterized SQL, tenant-scoped queries, foreign keys, check constraints, and transactions for multi-record operations.
- Add workflow-step persistence with unique `(workflow_run_id, step_key)` identity and bounded attempts.
- Implement idempotency using a request hash and a stored response; reject reuse of the same key with a different request.
- Record security-sensitive and business-critical changes in audit logs, while excluding secrets and unnecessary personal data.

## Priority 2 — AI and execution isolation

- Treat all model output, customer content, retrieved documents, and generated code as untrusted input.
- Validate structured model output against schemas and domain policy before any state change.
- Give agents narrow, explicit capabilities rather than unrestricted database or shell access.
- Run generated code in an isolated, resource-limited environment with no production credentials by default.
- Require explicit human approval for publication, commercial commitments, production deployment, destructive actions, and delivery when quality checks fail.

## Priority 3 — Verification and operations

- Add unit tests for authorization, tenant isolation, lifecycle transitions, idempotency, and workflow retries.
- Add PostgreSQL integration tests for constraints, transactions, and concurrent updates.
- Add dependency and secret scanning, static analysis, and CI checks.
- Configure rate limits, secure headers, strict CORS allowlists, request-size limits, structured redacted logs, and readiness checks.
- Document backup/restore, incident response, key rotation, retention, and deployment rollback procedures.

## Acceptance criteria

- Protected routes reject missing identities and insufficient permissions.
- Cross-organization reads and writes do not disclose whether another organization's resource exists.
- Invalid transitions and stale concurrent updates are rejected.
- Repeated idempotent requests do not duplicate side effects.
- Failed workflow steps are observable and retryable within a bounded policy.
- Tests and build checks are executed in CI; no pass status is claimed without recorded results.

This plan is a work sequence, not a claim that every control is already implemented.