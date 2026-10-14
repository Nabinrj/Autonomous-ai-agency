import type { Pool } from 'pg';
import { conflict, notFound } from '../../common/errors/app-error.js';
import type { CreateWorkflowStepInput, WorkflowStep, WorkflowStepRepository, WorkflowStepStatus } from './workflow-step.types.js';

function mapStep(row: Record<string, unknown>): WorkflowStep {
  return {
    id: String(row.id),
    workflowRunId: String(row.workflow_run_id),
    stepKey: String(row.step_key),
    status: row.status as WorkflowStepStatus,
    attempt: Number(row.attempt),
    inputReference: row.input_reference == null ? null : String(row.input_reference),
    outputReference: row.output_reference == null ? null : String(row.output_reference),
    errorCode: row.error_code == null ? null : String(row.error_code),
    errorMessage: row.error_message == null ? null : String(row.error_message),
  };
}

const columns = 'ws.id, ws.workflow_run_id, ws.step_key, ws.status, ws.attempt, ws.input_reference, ws.output_reference, ws.error_code, ws.error_message';

export class PostgresWorkflowStepRepository implements WorkflowStepRepository {
  constructor(private readonly pool: Pool) {}

  async create(organizationId: string, input: CreateWorkflowStepInput): Promise<WorkflowStep> {
    try {
      const result = await this.pool.query(
        `INSERT INTO workflow_steps (workflow_run_id, step_key, input_reference)
         SELECT wr.id, $3, $4 FROM workflow_runs wr
         WHERE wr.organization_id = $1 AND wr.id = $2
         RETURNING id, workflow_run_id, step_key, status, attempt, input_reference, output_reference, error_code, error_message`,
        [organizationId, input.workflowRunId, input.stepKey, input.inputReference ?? null],
      );
      if (!result.rows[0]) throw notFound('Workflow run');
      return mapStep(result.rows[0]);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        throw conflict('A step with this key already exists for the workflow.');
      }
      throw error;
    }
  }

  async findById(organizationId: string, workflowRunId: string, id: string): Promise<WorkflowStep | null> {
    const result = await this.pool.query(
      `SELECT ${columns} FROM workflow_steps ws
       JOIN workflow_runs wr ON wr.id = ws.workflow_run_id
       WHERE wr.organization_id = $1 AND wr.id = $2 AND ws.id = $3`,
      [organizationId, workflowRunId, id],
    );
    return result.rows[0] ? mapStep(result.rows[0]) : null;
  }

  async list(organizationId: string, workflowRunId: string): Promise<WorkflowStep[]> {
    const result = await this.pool.query(
      `SELECT ${columns} FROM workflow_steps ws
       JOIN workflow_runs wr ON wr.id = ws.workflow_run_id
       WHERE wr.organization_id = $1 AND wr.id = $2
       ORDER BY ws.created_at ASC, ws.id ASC`,
      [organizationId, workflowRunId],
    );
    return result.rows.map(mapStep);
  }

  async transition(
    organizationId: string,
    workflowRunId: string,
    id: string,
    expectedStatus: WorkflowStepStatus,
    nextStatus: WorkflowStepStatus,
    resultData: { outputReference?: string; errorCode?: string; errorMessage?: string } = {},
  ): Promise<WorkflowStep> {
    const terminal = ['COMPLETED', 'FAILED', 'SKIPPED', 'CANCELLED'].includes(nextStatus);
    const result = await this.pool.query(
      `UPDATE workflow_steps ws SET
         status = $5,
         attempt = CASE WHEN $5 = 'RUNNING' AND $4 IN ('PENDING', 'FAILED', 'WAITING') THEN ws.attempt + 1 ELSE ws.attempt END,
         output_reference = COALESCE($6, ws.output_reference),
         error_code = CASE WHEN $5 = 'FAILED' THEN $7 ELSE NULL END,
         error_message = CASE WHEN $5 = 'FAILED' THEN $8 ELSE NULL END,
         started_at = CASE WHEN $5 = 'RUNNING' THEN NOW() ELSE ws.started_at END,
         completed_at = CASE WHEN $9 THEN NOW() ELSE NULL END
       FROM workflow_runs wr
       WHERE wr.id = ws.workflow_run_id AND wr.organization_id = $1
         AND wr.id = $2 AND ws.id = $3 AND ws.status = $4
       RETURNING ${columns}`,
      [organizationId, workflowRunId, id, expectedStatus, nextStatus, resultData.outputReference ?? null,
        resultData.errorCode ?? null, resultData.errorMessage ?? null, terminal],
    );
    if (result.rows[0]) return mapStep(result.rows[0]);
    const existing = await this.findById(organizationId, workflowRunId, id);
    if (!existing) throw notFound('Workflow step');
    throw conflict('Workflow step changed concurrently or is no longer in the expected state.');
  }
}
