import type { Pool } from 'pg';
import type { Requirement, RequirementRepository, RequirementStatus, RequirementVersion } from './requirement.types.js';

function mapRequirement(row: Record<string, unknown>): Requirement {
  return { id: String(row.id), organizationId: String(row.organization_id), customerId: String(row.customer_id), status: row.status as RequirementStatus, approvedVersionId: row.approved_version_id ? String(row.approved_version_id) : null };
}

function mapVersion(row: Record<string, unknown>): RequirementVersion {
  return { id: String(row.id), requirementId: String(row.requirement_id), versionNumber: Number(row.version_number), content: row.content as Record<string, unknown>, completenessScore: row.completeness_score == null ? null : Number(row.completeness_score) };
}

export class PostgresRequirementRepository implements RequirementRepository {
  constructor(private readonly pool: Pool) {}

  async findById(organizationId: string, id: string): Promise<Requirement | null> {
    const result = await this.pool.query('SELECT id, organization_id, customer_id, status, approved_version_id FROM requirements WHERE organization_id = $1 AND id = $2', [organizationId, id]);
    return result.rows[0] ? mapRequirement(result.rows[0]) : null;
  }

  async getVersion(organizationId: string, requirementId: string, versionId: string): Promise<RequirementVersion | null> {
    const result = await this.pool.query(`SELECT rv.id, rv.requirement_id, rv.version_number, rv.content, rv.completeness_score FROM requirement_versions rv JOIN requirements r ON r.id = rv.requirement_id WHERE r.organization_id = $1 AND rv.requirement_id = $2 AND rv.id = $3`, [organizationId, requirementId, versionId]);
    return result.rows[0] ? mapVersion(result.rows[0]) : null;
  }

  async updateStatus(organizationId: string, id: string, status: RequirementStatus, approvedVersionId?: string): Promise<Requirement> {
    const result = await this.pool.query(`UPDATE requirements SET status = $3, approved_version_id = CASE WHEN $4::uuid IS NULL THEN approved_version_id ELSE $4::uuid END, updated_at = NOW() WHERE organization_id = $1 AND id = $2 RETURNING id, organization_id, customer_id, status, approved_version_id`, [organizationId, id, status, approvedVersionId ?? null]);
    return mapRequirement(result.rows[0]);
  }
}
