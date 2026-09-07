# Workflow Architecture

## 1. Purpose

The Autonomous AI Agency is a workflow-driven system. A workflow coordinates deterministic application logic, AI decisions, external integrations, approvals, retries, and artifact production.

## 2. Workflow principles

- Every long-running business process has a durable workflow identity.
- Workflows are resumable after process or infrastructure failure.
- External side effects are idempotent.
- AI outputs are treated as untrusted proposals until validated.
- Human approval is explicit when required by policy.
- Each step has timeout, retry, and failure behavior.
- Workflow state is not reconstructed from logs.

## 3. Workflow lifecycle

```text
CREATED -> RUNNING -> WAITING -> RUNNING -> COMPLETED
                         |
                         +-> FAILED
                         +-> CANCELLED
                         +-> TIMED_OUT
```

## 4. Core workflows

### 4.1 Lead qualification

```text
Lead created
  -> normalize contact data
  -> deduplicate
  -> enrich when permitted
  -> classify intent
  -> score lead
  -> apply qualification rules
  -> QUALIFIED / DISQUALIFIED
```

AI can recommend a classification, but deterministic policy decides the final state when confidence or policy requires it.

### 4.2 Requirement gathering

```text
Lead converted
  -> create conversation
  -> gather missing requirements
  -> validate answers
  -> summarize
  -> generate structured requirement draft
  -> schema validation
  -> completeness checks
  -> human/customer review
  -> requirements approved
```

The workflow pauses when waiting for a human/customer response.

### 4.3 Proposal generation

```text
Approved requirements
  -> estimate scope
  -> generate proposal draft
  -> validate totals/constraints
  -> owner review
  -> publish/send proposal
  -> record outcome
```

Commercial commitments are approval-gated.

### 4.4 Production workflow

```text
Approved project
  -> create execution plan
  -> generate task graph
  -> prepare isolated workspace
  -> generate code/assets
  -> run static checks
  -> run tests
  -> review outputs
  -> fix/retry bounded failures
  -> quality gate
  -> package artifact
```

Generated code must execute in an isolated environment. Production credentials are never exposed to an untrusted generation workspace.

### 4.5 Delivery workflow

```text
Quality gate passed
  -> build release package
  -> generate release notes
  -> deploy to staging when applicable
  -> verify deployment
  -> production approval
  -> deploy
  -> smoke test
  -> send delivery notification
  -> mark delivered
```

## 5. Workflow step contract

Each step should have a conceptual contract:

```json
{
  "step_id": "generate_requirements",
  "workflow_run_id": "uuid",
  "status": "RUNNING",
  "attempt": 1,
  "timeout_seconds": 120,
  "input_reference": "internal-reference",
  "output_reference": null,
  "error_code": null
}
```

Large inputs and outputs should be stored as references to database/object-storage records rather than copied repeatedly into workflow metadata.

## 6. Retry policy

Retry only failures that are likely transient.

Retryable examples:

- Temporary network failure.
- Rate limiting with provider guidance.
- Temporary database connection failure.
- Worker interruption.

Normally non-retryable examples:

- Invalid schema.
- Authorization failure.
- Business-rule violation.
- Missing required customer information.
- Unsafe generated artifact.

Retries use bounded attempts and exponential backoff with jitter.

## 7. Idempotency and external side effects

A workflow may be replayed or retried. External side effects must therefore use an idempotency key derived from the workflow and logical operation.

Example:

```text
publish-social-post:{workflow_run_id}:{post_id}
```

Before performing the side effect, the integration checks whether that operation has already succeeded.

## 8. Human approval gates

The workflow engine represents approval as a durable wait state.

Typical gates:

- Public marketing publication.
- Commercial proposal.
- Material requirement changes.
- Production deployment.
- Final delivery when quality confidence is insufficient.
- Destructive actions.

A workflow cannot bypass an approval by simply retrying a previous step.

## 9. AI step contract

AI steps follow:

```text
Prompt/context
   -> model/provider adapter
   -> raw response
   -> structured parsing
   -> schema validation
   -> policy/quality checks
   -> domain action
```

Raw model output is never treated as a trusted command.

## 10. Context management

Workflow context is separated into:

- Stable business identifiers.
- Current step input.
- Retrieved knowledge references.
- Model output.
- Validated domain output.
- Audit metadata.

Conversation history and large documents should be retrieved on demand rather than permanently copied into every step.

## 11. Events

Successful domain transitions publish versioned events such as:

- `lead.created`
- `lead.qualified`
- `requirements.ready_for_review`
- `requirements.approved`
- `workflow.started`
- `build.completed`
- `test.completed`
- `delivery.completed`

Events are notifications of facts, not replacements for transactional state.

## 12. Failure handling

When a workflow fails:

1. Persist the failed step and error classification.
2. Stop unsafe downstream actions.
3. Record diagnostic context without secrets.
4. Retry if policy permits.
5. Escalate to an operator when recovery is not automatic.
6. Keep the workflow resumable where possible.

## 13. Concurrency

Workflows must declare resource conflicts where necessary. Examples:

- Two production deployments cannot mutate the same environment concurrently.
- Two requirement-edit operations should use optimistic concurrency.
- A customer conversation should preserve message ordering.

## 14. Cancellation

Cancellation is cooperative. Workers check cancellation state before starting consequential work and at safe checkpoints.

External actions already completed are not magically rolled back; compensating actions are used where appropriate.

## 15. Workflow observability

Every workflow and step records:

- Workflow ID.
- Correlation ID.
- Entity/project ID.
- Start/end timestamps.
- Status.
- Attempt number.
- Duration.
- Error classification.
- Worker/version metadata.
- AI model metadata when applicable.

## 16. Initial implementation strategy

The architecture is designed for Temporal or an equivalent durable workflow engine. During early local development, a simpler worker/queue implementation may be used behind the same application workflow interfaces.

The application must not couple business rules directly to one orchestration vendor's APIs.

## 17. Workflow acceptance criteria

A workflow is production-ready only when it can demonstrate:

- Resume after worker restart.
- Bounded retries.
- Duplicate-safe external operations.
- Explicit approval enforcement.
- Structured failure reporting.
- Traceable inputs and outputs.
- Safe cancellation.
- Automated tests for successful and failure paths.
