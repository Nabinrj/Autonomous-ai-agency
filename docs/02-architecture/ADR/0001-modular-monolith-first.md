# ADR-0001: Start with a Modular Monolith

**Status:** Accepted for MVP  
**Date:** 2026-09-07  
**Decision Type:** Architecture  

## Context

The Autonomous AI Agency contains many logical capabilities, but the initial system is being built by a small team and must prove a complete workflow before operational complexity grows.

A microservice-per-module architecture from the beginning would introduce additional deployment, networking, authentication, observability, and data-consistency overhead before the product has demonstrated that those boundaries are correct.

## Decision

The MVP will use a **modular monolith for the core API/domain logic**, combined with **separate worker processes for asynchronous workloads** where necessary.

Logical modules will still have strict boundaries inside the codebase.

```text
Core API
├── Auth
├── Customers
├── Leads
├── Conversations
├── Requirements
├── Projects
├── Documents
├── Approvals
└── Audit

Workers
├── AI jobs
├── Integration jobs
├── Document jobs
└── Testing/build jobs
```

## Consequences

### Positive

- Faster initial development.
- Easier local setup.
- Simpler transactions across related business data.
- Lower infrastructure cost.
- Easier debugging.
- Clear path to split services later if real scaling requirements justify it.

### Negative

- The codebase can become tightly coupled if module boundaries are ignored.
- Some workloads will still require separate workers.
- Future extraction into services may require interface cleanup.

## Constraints

Modules must communicate through explicit application/domain interfaces rather than directly accessing another module's internal implementation.

## Revisit When

Reconsider this decision when one or more of the following becomes true:

- A module needs independent scaling.
- A module requires a substantially different runtime.
- Deployment independence provides measurable operational value.
- Team ownership becomes large enough to justify service boundaries.
- Reliability isolation requires a separate service.
