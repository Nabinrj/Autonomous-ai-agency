import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { Pool } from 'pg';
import type { UserRole } from '../../common/types/request-context.js';
import type { AuthenticationProvider, AuthenticatedPrincipal } from './auth.types.js';

const USER_ROLES = new Set<UserRole>(['OWNER', 'ADMIN', 'OPERATOR', 'REVIEWER', 'CUSTOMER', 'SYSTEM']);

interface PrincipalRow {
  user_id: string;
  organization_id: string;
  role_code: string | null;
  permission_code: string | null;
}

/**
 * Validates an OIDC access token using the issuer's remote JWKS and resolves
 * authorization from database assignments. Token-provided roles/permissions are ignored.
 */
export class OidcAuthenticationProvider implements AuthenticationProvider {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly db: Pool,
    private readonly issuer: string,
    private readonly audience: string,
    jwksUrl: string,
  ) {
    this.jwks = createRemoteJWKSet(new URL(jwksUrl), {
      timeoutDuration: 5_000,
      cooldownDuration: 30_000,
      cacheMaxAge: 10 * 60_000,
    });
  }

  async authenticate(headers: Record<string, string | undefined>): Promise<AuthenticatedPrincipal | null> {
    const authorization = headers.authorization;
    if (!authorization) return null;
    const match = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/i.exec(authorization);
    if (!match?.[1]) return null;

    let subject: string;
    try {
      const verified = await jwtVerify(match[1], this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256', 'ES256'],
        requiredClaims: ['sub', 'iss', 'aud', 'exp', 'iat'],
        clockTolerance: 5,
      });
      if (typeof verified.payload.sub !== 'string' || verified.payload.sub.length === 0) return null;
      subject = verified.payload.sub;
    } catch {
      // Invalid, expired, wrong-issuer, or wrong-audience tokens fail closed.
      return null;
    }

    const result = await this.db.query<PrincipalRow>(
      `SELECT u.id AS user_id, u.organization_id, r.code AS role_code, p.code AS permission_code
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.identity_provider = $1
         AND u.auth_subject = $2
         AND u.is_active = TRUE`,
      [this.issuer, subject],
    );
    if (result.rows.length === 0) return null;

    const first = result.rows[0]!;
    const roles = new Set<UserRole>();
    const permissions = new Set<string>();
    for (const row of result.rows) {
      if (row.user_id !== first.user_id || row.organization_id !== first.organization_id) {
        throw new Error('Authentication query returned inconsistent user identity rows.');
      }
      if (row.role_code) {
        if (!USER_ROLES.has(row.role_code as UserRole)) {
          throw new Error('An unsupported role is assigned to the authenticated user.');
        }
        roles.add(row.role_code as UserRole);
      }
      if (row.permission_code) permissions.add(row.permission_code);
    }

    return {
      userId: first.user_id,
      organizationId: first.organization_id,
      roles: [...roles],
      permissions: [...permissions],
    };
  }
}
