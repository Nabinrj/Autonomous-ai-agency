import type { RequestContext, UserRole } from '../../common/types/request-context.js';

export interface AuthenticatedPrincipal {
  userId: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
}

export interface AuthenticationProvider {
  authenticate(headers: Record<string, string | undefined>): Promise<AuthenticatedPrincipal | null>;
}

export function toRequestContext(
  principal: AuthenticatedPrincipal,
  requestId: string,
  correlationId: string,
): RequestContext {
  return { ...principal, requestId, correlationId };
}
