# Production authentication setup

## Required configuration

Set these values explicitly in the deployment environment:

- NODE_ENV=production
- DATABASE_URL: private PostgreSQL connection string with TLS enabled where supported by the hosting provider
- OIDC_ISSUER: exact HTTPS issuer URL from your identity provider
- OIDC_AUDIENCE: API audience configured for this backend
- OIDC_JWKS_URL: HTTPS URL of the issuer's JSON Web Key Set
- CORS_ORIGIN: one exact HTTPS frontend origin, without a path or trailing slash

The backend rejects production configuration when required values are missing. It does not fall back to development authentication. Keep the database private and use a database role with only the privileges needed by the application and migrations separately.

## Provision an application identity

1. Apply migrations 0001, 0002, and 0003 in order.
2. Create or invite the user through the chosen identity provider.
3. Obtain the user's stable OIDC subject from a trusted administrative workflow. Do not accept a subject, organization ID, role, or permission from a public registration form.
4. Provision the matching application user and link the trusted issuer and subject to that row. Assign roles through user_roles and the seeded roles/permissions.
5. Test with a token whose issuer, audience, expiry, signature, and signing algorithm are valid. Confirm that an unknown subject, inactive user, expired token, wrong issuer, wrong audience, and unassigned permission are denied.

OIDC tokens provide identity only. The API loads organization, active status, roles, and permissions from PostgreSQL; it ignores roles and permissions carried in the token.

## Important limitations

This implements JWT verification against a remote JWKS and database-backed RBAC, not the full sign-in experience. The identity provider's authorization-code flow, MFA, account recovery, user provisioning, token issuance, and logout must be configured at the provider or in a dedicated frontend/auth service. Do not store access tokens in localStorage for a browser app; prefer an appropriate secure session/BFF design for the eventual frontend.

The API currently trusts the configured OIDC issuer to issue access tokens intended for the configured audience. Use a dedicated API audience and short-lived access tokens. Keep JWKS endpoint and issuer values under deployment control, not request control.
