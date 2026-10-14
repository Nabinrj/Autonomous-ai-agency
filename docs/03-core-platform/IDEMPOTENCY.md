# Idempotent API operations

## Contract

The backend idempotency service reserves an operation by (organization_id, Idempotency-Key), hashes the validated request, executes database writes in one PostgreSQL transaction, and stores the response status/body before commit.

- Require an Idempotency-Key for retryable create/command endpoints that may be repeated by clients or workers.
- Scope every key to the authenticated organization; never accept organization identity from an untrusted request body.
- Hash the validated semantic request, not raw JSON bytes. Object-key order is normalized; array order is preserved.
- Reusing a key with a different request hash returns HTTP 409.
- A successful replay returns the persisted status and body and sets replayed: true in the service result. Routes should expose this as a response header (for example, Idempotency-Replayed: true) rather than altering the original response body.
- The operation callback MUST use the supplied transaction client for every database write it performs. Do not use the global pool inside that callback.
- Do not perform external effects (email, social publishing, AI provider calls, deployment, or webhooks) inside the transaction. Persist an outbox/job record transactionally, commit, and let a worker perform the external effect with provider-side idempotency where available.
- Keep keys for a documented retention period and add cleanup only after the period exceeds client retry windows and incident investigation needs.

## Failure behavior

A thrown callback error rolls back both the reservation and the callback's database writes. A concurrent request with the same organization/key waits for the reservation transaction to finish, then either replays the committed response or reserves the key if the original transaction rolled back.

A key mismatch returns a conflict. A committed reservation with no response is treated as an integrity incident; it is not silently executed again.

## Current scope

The reusable service and canonical request-hash unit tests are implemented. It is not yet wired into individual HTTP routes, and external side effects still require an outbox/worker before they can safely be automated. Do not claim end-to-end idempotency for a route until the route uses this service and integration tests exercise concurrent requests against PostgreSQL.
