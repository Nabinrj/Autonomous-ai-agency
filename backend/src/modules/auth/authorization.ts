import { forbidden, unauthorized } from '../../common/errors/app-error.js';
import type { RequestContext } from '../../common/types/request-context.js';

export function requirePermission(context: RequestContext | undefined, permission: string): void {
  if (!context) throw unauthorized();
  if (!context.permissions.includes(permission) && !context.roles.includes('OWNER')) {
    throw forbidden(`Missing permission: ${permission}`);
  }
}

export function assertOrganization(context: RequestContext, organizationId: string): void {
  if (context.organizationId !== organizationId) {
    throw forbidden('Organization boundary violation');
  }
}
