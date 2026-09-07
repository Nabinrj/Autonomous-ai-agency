# ADR-0003: Provider-Neutral AI Interface

**Status:** Accepted for MVP  
**Date:** 2026-09-07  

## Context

The platform will use LLMs for multiple workflows. Different providers may offer different models, pricing, latency, context windows, structured-output support, and availability.

Hard-coding business workflows to one provider would increase vendor lock-in and make model evaluation harder.

## Decision

Business modules will depend on an internal AI interface rather than directly importing a provider SDK.

Conceptually:

```text
Business Workflow
      ↓
AI Service Interface
      ↓
Provider Adapter
      ↓
External LLM API
```

## Required Capabilities

The abstraction should support, as needed:

- text generation
- structured generation
- embeddings
- moderation/safety checks
- usage metadata

## Consequences

Provider-specific features may require optional capabilities. The abstraction must not become so generic that it prevents useful provider functionality.

Provider SDKs remain inside the integration/AI layer.

## Revisit When

Revisit after the first real AI workflows are implemented and provider-specific requirements are known.
