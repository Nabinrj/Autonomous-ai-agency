# Event Contracts

**Document ID:** ARCH-004  
**Status:** Baseline  

Events communicate facts that have already happened. They are not commands disguised as facts.

## Event Envelope

Every internal event should follow a common envelope:

```json
{
  "event_id": "uuid",
  "event_type": "lead.created",
  "event_version": 1,
  "occurred_at": "2026-09-07T00:00:00Z",
  "actor_type": "system",
  "actor_id": "uuid",
  "correlation_id": "uuid",
  "payload": {}
}
```

## Initial Events

### `lead.created`

```json
{
  "lead_id": "uuid",
  "source": "social",
  "source_reference": "external-id"
}
```

### `lead.qualified`

```json
{
  "lead_id": "uuid",
  "qualification_status": "qualified",
  "reason_code": "project_fit"
}
```

### `requirements.ready_for_review`

```json
{
  "requirement_id": "uuid",
  "version": 1,
  "project_id": "uuid"
}
```

### `requirements.approved`

```json
{
  "requirement_id": "uuid",
  "version": 1,
  "approved_by": "uuid"
}
```

### `workflow.started`

```json
{
  "workflow_id": "uuid",
  "workflow_type": "project.build"
}
```

### `build.completed`

```json
{
  "project_id": "uuid",
  "build_id": "uuid",
  "status": "passed",
  "artifact_id": "uuid"
}
```

### `test.completed`

```json
{
  "project_id": "uuid",
  "test_run_id": "uuid",
  "status": "passed",
  "failed_count": 0
}
```

### `delivery.completed`

```json
{
  "project_id": "uuid",
  "artifact_id": "uuid",
  "delivery_channel": "email"
}
```

## Event Rules

1. Events must be versioned.
2. Consumers must tolerate duplicate delivery where the transport can retry.
3. Event handlers must be idempotent where duplicate processing is possible.
4. Sensitive data should not be placed into event payloads unless required.
5. Schema changes must be backwards-compatible or use a new event version.
