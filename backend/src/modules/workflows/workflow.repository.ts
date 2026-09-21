import type { Pool } from 'pg';
import type { CreateWorkflowRunInput, WorkflowRepository, WorkflowRun, WorkflowStatus } from './workflow.types.js';

function mapWorkflow(row: Record<string, unknown>): WorkflowRun {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    workflowType: String(row.workflow_type),
    entityType: row.entity_type == null ? null : String(row.entity_type),
    entityId: row.entity_id == null ? null : String(row.entity_id),
    status: row.status as WorkflowStatus,
    correlationId: String(row.correlation_id),
    errorCode: row.error_code == null ? null : String(row.error_code),
    errorMessage: row.error_message == null ? null : String(row.error_message),
  };
}

export class PostgresWorkflowRepository implements WorkflowRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateWorkflowRunInput): Promise<WorkflowRun> {
    const result = await this.pool.query(
      `INSERT INTO workflow_runs (organization_id, workflow_type, entity_type, entity_id, correlation_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, workflow_type, entity_type, entity_id, status, correlation_id, error_code, error_message`,
      [input.organizationId, input.workflowType, input.entityType ?? null, input.entityId ?? null, input.correlationId],
    );
    return mapWorkflow(result.rows[0]);
  }

  async findById(organizationId: string, id: string): Promise<WorkflowRun | null> {
    const result = await this.pool.query(
      'SELECT id, organization_id, workflow_type, entity_type, entity_id, status, correlation_id, error_code, error_message FROM workflow_runs WHERE organization_id = $1 AND id = $2',
      [organizationId, id],
    );
    return result.rows[0] ? mapWorkflow(result.rows[0]) : null;
  }

  async updateStatus(organizationId: string, id: string, status: WorkflowStatus, errorCode?: string, errorMessage?: string): Promise<WorkflowRun> {
    const result = await this.pool.query(
      `UPDATE workflow_runs SET status = $3,
       error_code = CASE WHEN $4::text IS NULL THEN error_code ELSE $4 END,
       error_message = CASE WHEN $5::text IS NULL THEN error_message ELSE $5 END,
       started_at = CASE WHEN $3 = 'RUNNING' AND started_at IS NULL THEN NOW() ELSE started_at END,
       completed_at = CASE WHEN $3 IN ('COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT') THEN NOW() ELSE completed_at END,
       updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING id, organization_id, workflow_type, entity_type, entity_id, status, correlation_id, error_code, error_message`,
      [organizationId, id, status, errorCode ?? null, errorMessage ?? null],
    );
    if (!result.rows[0]) throw new Error('Workflow run was not found.');
    return mapWorkflow(result.rows[0]);
  }
}