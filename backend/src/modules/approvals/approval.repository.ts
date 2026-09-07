import type { Pool } from 'pg';
import type { Approval, ApprovalRepository, ApprovalStatus, ApprovalType } from './approval.types.js';

function mapApproval(row: Record<string, unknown>): Approval {
  return { id: String(row.id), organizationId: String(row.organization_id), projectId: row.project_id ? String(row.project_id) : null, requirementId: row.requirement_id ? String(row.requirement_id) : null, approvalType: row.approval_type as ApprovalType, status: row.status as ApprovalStatus, requestedBy: String(row.requested_by), decidedBy: row.decided_by ? String(row.decided_by) : null, decisionNote: row.decision_note ? String(row.decision_note) : null, decidedAt: row.decided_at ? String(row.decided_at) : null };
}

export class PostgresApprovalRepository implements ApprovalRepository {
  constructor(private readonly pool: Pool) {}

  async findById(organizationId: string, id: string): Promise<Approval | null> {
    const result = await this.pool.query('SELECT id, organization_id, project_id, requirement_id, approval_type, status, requested_by, decided_by, decision_note, decided_at FROM approvals WHERE organization_id = $1 AND id = $2', [organizationId, id]);
    return result.rows[0] ? mapApproval(result.rows[0]) : null;
  }

  async decide(organizationId: string, id: string, status: 'APPROVED' | 'REJECTED', decidedBy: string, note?: string): Promise<Approval> {
    const result = await this.pool.query('UPDATE approvals SET status = $3, decided_by = $4, decision_note = $5, decided_at = NOW() WHERE organization_id = $1 AND id = $2 AND status = \'PENDING\' RETURNING id, organization_id, project_id, requirement_id, approval_type, status, requested_by, decided_by, decision_note, decided_at', [organizationId, id, status, decidedBy, note ?? null]);
    return mapApproval(result.rows[0]);
  }
}
