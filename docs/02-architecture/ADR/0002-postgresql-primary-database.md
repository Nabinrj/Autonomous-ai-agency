# ADR-0002: PostgreSQL as Primary Database

**Status:** Accepted for MVP  
**Date:** 2026-09-07  

## Context

The platform contains strongly related entities such as users, organizations, customers, leads, conversations, requirements, projects, approvals, workflows, and audit records.

## Decision

Use **PostgreSQL as the primary transactional database**.

## Reasons

- Strong relational integrity.
- Transactions across related business operations.
- Mature indexing and query capabilities.
- JSON support for flexible metadata without abandoning relational structure.
- Good TypeScript ecosystem.
- Suitable for the expected MVP and early production scale.

## Consequences

Redis may still be used for caching, queues, locks, and temporary coordination, but it is not the business source of truth.

Vector search may later use Qdrant or PostgreSQL with pgvector depending on measured requirements.

## Revisit When

Reconsider only if actual workload characteristics show a clear need for a different primary persistence architecture.
