# Security Architecture

## 1. Security objective

The agency can act on behalf of an owner and customers, so security must be designed around least privilege, explicit authorization, isolation, auditability, and safe failure.

## 2. Trust boundaries

```text
Internet / Social Platforms / Customers
                |
          API / Webhook Edge
                |
        Authentication + WAF
                |
        Application Modules
          /           \
       Database      Queue
                       |
                    Workers
                       |
              AI / Integrations
                       |
              Isolated Build Lab
```

Untrusted external input and AI-generated content must not cross into privileged execution without validation.

## 3. Identity and access

- Authenticate every protected request.
- Authorize every resource operation.
- Use roles plus fine-grained permissions.
- Apply organization/tenant scoping to queries.
- Use short-lived credentials where practical.
- Keep service-to-service credentials separate from user credentials.
- Never put secrets in source control.

## 4. AI security boundary

AI output is untrusted data.

The following controls are mandatory before AI output becomes a domain action:

1. Structured schema validation.
2. Business-rule validation.
3. Permission checks.
4. Policy/safety checks.
5. Human approval when required.
6. Audit event for consequential actions.

Prompt injection and malicious customer-provided content must be treated as possible adversarial input.

## 5. Generated-code isolation

AI-generated code is executed only in an isolated build environment. The build environment must have:

- No production credentials.
- Restricted network egress.
- Resource/time limits.
- Ephemeral workspaces.
- Non-privileged execution.
- Dependency and artifact scanning where applicable.
- Explicit input/output boundaries.

The agency must never allow generated code to execute directly inside the API process.

## 6. Secrets management

Secrets include:

- AI provider keys.
- Social platform credentials/tokens.
- Database credentials.
- Email provider credentials.
- Object-storage credentials.
- Deployment credentials.

Rules:

- Local development uses `.env` excluded from Git.
- Shared/production environments use a secret manager or platform secret store.
- Secrets are never logged.
- Rotate credentials when exposure is suspected.
- Use separate credentials for development, staging, and production.

## 7. Data protection

- TLS for all external traffic.
- Encryption at rest through managed database/storage controls where available.
- Minimize stored personal data.
- Apply retention and deletion policies.
- Redact sensitive fields from logs.
- Restrict access to customer conversations and requirements.

## 8. API protection

- Request schema validation.
- Rate limiting.
- Body-size limits.
- Strict CORS.
- Secure headers.
- Authentication throttling.
- Webhook signature verification.
- Replay protection for signed webhooks where supported.
- Idempotency for side-effecting commands.

## 9. Database security

- Parameterized queries only.
- Least-privilege database roles.
- No direct database access from untrusted clients.
- Foreign-key and uniqueness constraints.
- Backup encryption where supported.
- Audit privileged schema operations.

## 10. Authorization model

A request must satisfy:

```text
Authenticated?
   AND correct organization?
   AND required permission?
   AND resource accessible?
   AND state transition allowed?
```

All four/five checks are performed server-side as applicable.

## 11. Social integrations

Only official platform APIs are used. Tokens are stored securely and scoped to the minimum required permissions. Publishing and messaging operations are audited.

Platform terms, rate limits, privacy requirements, and permission changes are treated as integration constraints rather than bypassed.

## 12. Auditability

Audit events should capture:

- Who/what acted.
- What resource was affected.
- Action performed.
- Timestamp.
- Request/correlation ID.
- Outcome.
- Relevant before/after state references where appropriate.

Do not store secrets or unnecessary sensitive payloads in audit logs.

## 13. Security incident handling

Minimum response path:

```text
Detect -> Contain -> Preserve evidence -> Rotate/revoke -> Recover -> Review -> Improve
```

The system should make credential rotation, job cancellation, account disabling, and workflow pausing operationally possible.

## 14. Dependency and supply-chain security

- Pin or constrain important dependencies.
- Run dependency vulnerability checks in CI.
- Keep lockfiles committed.
- Review new privileged packages.
- Build from reproducible container/dependency inputs where practical.

## 15. Production safety rules

The following actions are approval-gated until sufficient reliability has been demonstrated:

- Production deployment.
- Public publishing.
- Commercial commitments.
- Destructive data operations.
- Material project-scope changes.

## 16. Security testing

CI and pre-release testing should cover:

- Authentication bypass attempts.
- Broken object-level authorization.
- Input validation.
- Rate limiting.
- Webhook verification.
- Secret leakage checks.
- Dependency vulnerabilities.
- Generated-code sandbox boundaries.
- Prompt-injection resistance for high-risk AI workflows.

## 17. Security acceptance criteria

A production candidate is not accepted unless it can demonstrate least-privilege access, protected secrets, validated AI outputs, isolated generated code, auditable privileged actions, tested recovery procedures, and secure handling of external webhooks/integrations.
