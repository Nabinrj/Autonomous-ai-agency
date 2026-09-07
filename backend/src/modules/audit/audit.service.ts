import type { AuditLogInput, AuditRepository } from './audit.types.js';

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  record(input: AuditLogInput): Promise<void> {
    return this.repository.record(input);
  }
}
