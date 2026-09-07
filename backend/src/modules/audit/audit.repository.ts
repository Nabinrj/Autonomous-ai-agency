import type { Pool } from 'pg';
import type { AuditLogInput, AuditRepository } from './audit.types.js';

export class PostgresAuditRepository implements AuditRepository {
  constructor(private readonly pool: Pool) {}

  async record(input: AuditLogInput): Promise<void> {
    await this.pool.query(`INSERT INTO audit_logs (organization_id, actor_type, actor_id, action, entity_type, entity_id, correlation_id, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`, [input.organizationId, input.actorType, input.actorId ?? null, input.action, input.entityType ?? null, input.entityId ?? null, input.correlationId ?? null, JSON.stringify(input.metadata ?? {})]);
  }
}
