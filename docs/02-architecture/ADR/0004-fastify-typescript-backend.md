# ADR-0004: Fastify + TypeScript Backend

- Status: Accepted
- Date: 2026-09-07

## Context

The agency needs a maintainable Node.js backend with strong typing, request validation, good performance, and low operational overhead. The project is starting as a modular monolith with separate workers.

## Decision

Use **TypeScript on Node.js with Fastify** for the initial backend.

The backend will be organized by business module rather than by technical layer alone. Fastify plugins/hooks will be used for cross-cutting concerns such as authentication, request IDs, validation, error handling, and observability.

## Why Fastify

- Lightweight core.
- Strong TypeScript ecosystem.
- Good request lifecycle hooks.
- Straightforward plugin model.
- Suitable for a modular monolith.
- Low framework overhead while the domain architecture is still evolving.

## Why not start with NestJS

NestJS is a valid alternative and may be appropriate if the codebase later needs a more opinionated dependency-injection/module framework. At the current stage, the additional framework conventions are not necessary enough to justify the complexity.

## Consequences

Positive:

- Small runtime surface.
- Clear ownership of business modules.
- Easy testing of application services.
- Provider/framework details remain replaceable.

Tradeoffs:

- The team must establish its own module conventions.
- Dependency injection patterns require discipline.
- Developers must avoid putting business logic directly in route handlers.

## Implementation rules

Route handlers should remain thin:

```text
HTTP request
  -> validation
  -> application command/query
  -> domain logic
  -> persistence/integration
  -> response mapping
```

Business modules must not depend directly on Fastify request objects outside the API adapter layer.

## Revisit trigger

Reconsider this decision if the project develops significant complexity around dependency injection, module lifecycle management, or organizational scale that Fastify conventions no longer handle cleanly.
