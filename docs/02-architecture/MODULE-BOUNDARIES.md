# Module Boundaries

**Document ID:** ARCH-002  
**Status:** Baseline  

## Responsibility Matrix

| Module | Owns | Must Not Own |
|---|---|---|
| Identity | users, roles, permissions | customer business data |
| CRM | leads, customers, contacts | model prompts |
| Conversations | messages, conversation state | final project scope without approval |
| Marketing | campaigns, content, publications | customer account passwords |
| Requirements | requirement versions and validation | direct deployment |
| Projects | project/task lifecycle | raw LLM provider logic |
| Documents | document versions and artifacts | workflow orchestration rules |
| Workflow | workflow execution | UI rendering |
| AI | model/provider interaction | authorization decisions |
| Production | build requests and build artifacts | unrestricted production credentials |
| QA | test execution and quality gates | customer billing decisions |
| Delivery | packaging and handoff | changing approved requirements silently |
| Notifications | notification delivery | modifying project truth |
| Audit | immutable action history | business-state ownership |

## Ownership Rule

Each persistent business entity must have one owning module. Other modules reference it through IDs and public application interfaces.

## Cross-Module Changes

When one action changes multiple domains, the initiating module starts an application workflow. The workflow coordinates the changes rather than allowing unrelated modules to directly mutate each other's tables.

## Example

A customer approving requirements should follow:

```text
Requirements API
    ↓
Authorization
    ↓
Requirements service
    ↓
Requirement status = APPROVED
    ↓
Audit event
    ↓
Project workflow event
    ↓
Project creation/planning
```

The Requirements module does not directly construct deployment infrastructure or call an LLM provider.
