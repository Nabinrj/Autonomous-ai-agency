export interface AuditLogInput {
  organizationId: string;
  actorType: string;
  actorId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditRepository {
  record(input: AuditLogInput): Promise<void>;
}
