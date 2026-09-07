import type { Pool } from 'pg';
import type { Project, ProjectRepository, ProjectStatus } from './project.types.js';

function mapProject(row: Record<string, unknown>): Project {
  return { id: String(row.id), organizationId: String(row.organization_id), customerId: String(row.customer_id), requirementId: String(row.requirement_id), approvedRequirementVersionId: row.approved_requirement_version_id ? String(row.approved_requirement_version_id) : null, name: String(row.name), status: row.status as ProjectStatus };
}

export class PostgresProjectRepository implements ProjectRepository {
  constructor(private readonly pool: Pool) {}

  async findById(organizationId: string, id: string): Promise<Project | null> {
    const result = await this.pool.query('SELECT id, organization_id, customer_id, requirement_id, approved_requirement_version_id, name, status FROM projects WHERE organization_id = $1 AND id = $2', [organizationId, id]);
    return result.rows[0] ? mapProject(result.rows[0]) : null;
  }

  async updateStatus(organizationId: string, id: string, status: ProjectStatus): Promise<Project> {
    const result = await this.pool.query('UPDATE projects SET status = $3, updated_at = NOW() WHERE organization_id = $1 AND id = $2 RETURNING id, organization_id, customer_id, requirement_id, approved_requirement_version_id, name, status', [organizationId, id, status]);
    return mapProject(result.rows[0]);
  }
}
