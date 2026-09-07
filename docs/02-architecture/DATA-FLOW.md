# Core Data Flow

**Document ID:** ARCH-003  
**Status:** Baseline  

## 1. Customer Acquisition Flow

```text
Campaign
  ↓
Social Publication
  ↓
Customer Interaction
  ↓
Lead Signal
  ↓
Lead Record
  ↓
Qualification
  ↓
Customer / Opportunity
```

## 2. Requirement Flow

```text
Conversation Message
  ↓
Conversation State
  ↓
AI Extraction
  ↓
Schema Validation
  ↓
Requirement Draft
  ↓
Conflict / Missing Information Check
  ↓
Customer Confirmation
  ↓
Requirement Version
  ↓
Approval
```

AI output is never treated as confirmed customer intent until the workflow's validation rules are satisfied.

## 3. Production Flow

```text
Approved Requirements
  ↓
Technical Plan
  ↓
Build Specification
  ↓
Generated Code
  ↓
Isolated Sandbox
  ↓
Build + Tests
  ↓
Quality Gate
  ↓
Artifact
  ↓
Delivery / Deployment
```

## 4. Artifact Flow

Binary or large generated files belong in object storage. PostgreSQL stores metadata such as:

- artifact ID
- project ID
- type
- storage key
- checksum
- version
- creation time
- producing workflow

## 5. Data Classification

| Data | Classification | Example Handling |
|---|---|---|
| Public marketing content | Low | Normal application storage |
| Internal workflow metadata | Internal | Authenticated access |
| Customer requirements | Confidential | RBAC + audit |
| Access tokens | Secret | Secrets manager/encrypted storage |
| Generated source code | Potentially sensitive | Restricted artifact access |
| Production credentials | Secret | Never expose to AI-generated code |

## 6. Deletion and Retention

Retention policies must be defined before production launch. Deleting a customer should account for related conversations, artifacts, audit requirements, and legally required records rather than simply deleting one database row.
