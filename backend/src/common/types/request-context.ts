export type UserRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'REVIEWER' | 'CUSTOMER' | 'SYSTEM';

export interface RequestContext {
  requestId: string;
  correlationId: string;
  userId: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
}
