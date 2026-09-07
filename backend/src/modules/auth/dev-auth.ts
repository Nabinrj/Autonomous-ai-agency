import type { AuthenticationProvider, AuthenticatedPrincipal } from './auth.types.js';

/** Development-only identity. Production must use a real authentication provider. */
export class DevelopmentAuthenticationProvider implements AuthenticationProvider {
  async authenticate(): Promise<AuthenticatedPrincipal> {
    return {
      userId: '00000000-0000-0000-0000-000000000001',
      organizationId: '00000000-0000-0000-0000-000000000001',
      roles: ['OWNER'],
      permissions: [
        'customer.read', 'customer.write',
        'lead.read', 'lead.write',
        'requirements.read', 'requirements.write', 'requirements.approve',
        'project.read', 'project.write', 'project.approve',
        'workflow.read', 'workflow.execute', 'audit.read',
      ],
    };
  }
}
