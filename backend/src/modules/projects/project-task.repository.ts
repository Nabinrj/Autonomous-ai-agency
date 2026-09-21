import type { Pool } from 'pg';
import type { CreateProjectTaskInput, ProjectTask, ProjectTaskRepository, ProjectTaskStatus } from './project-task.types.js';

function mapTask(row: Record<string, unknown>): ProjectTask {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    parentTaskId: row.parent_task_id ? String(row.parent_task_id) : null,
    title: String(row.title),
    description: row.description == null ? null : String(row.description),
    status: row.status as ProjectTaskStatus,
    assignedTo: row.assigned_to == null ? null : String(row.assigned_to),
    sortOrder: Number(row.sort_order),
  };
}

export class PostgresProjectTaskRepository implements ProjectTaskRepository {
  constructor(private readonly pool: Pool) {}

  async create(organizationId: string, input: CreateProjectTaskInput): Promise<ProjectTask> {
    const result = await this.pool.query(
      `INSERT INTO project_tasks (project_id, parent_task_id, title, description, assigned_to, sort_order)
       SELECT p.id, $2, $3, $4, $5, $6
       FROM projects p
       WHERE p.organization_id = $1 AND p.id = $7
       RETURNING id, project_id, parent_task_id, title, description, status, assigned_to, sort_order`,
      [organizationId, input.parentTaskId ?? null, input.title, input.description ?? null, input.assignedTo ?? null, input.sortOrder ?? 0, input.projectId],
    );
    if (!result.rows[0]) throw new Error('Project does not exist in the organization.');
    return mapTask(result.rows[0]);
  }

  async findById(organizationId: string, projectId: string, id: string): Promise<ProjectTask | null> {
    const result = await this.pool.query(
      `SELECT t.id, t.project_id, t.parent_task_id, t.title, t.description, t.status, t.assigned_to, t.sort_order
       FROM project_tasks t JOIN projects p ON p.id = t.project_id
       WHERE p.organization_id = $1 AND t.project_id = $2 AND t.id = $3`,
      [organizationId, projectId, id],
    );
    return result.rows[0] ? mapTask(result.rows[0]) : null;
  }

  async list(organizationId: string, projectId: string): Promise<ProjectTask[]> {
    const result = await this.pool.query(
      `SELECT t.id, t.project_id, t.parent_task_id, t.title, t.description, t.status, t.assigned_to, t.sort_order
       FROM project_tasks t JOIN projects p ON p.id = t.project_id
       WHERE p.organization_id = $1 AND t.project_id = $2 ORDER BY t.sort_order ASC, t.created_at ASC`,
      [organizationId, projectId],
    );
    return result.rows.map(mapTask);
  }

  async updateStatus(organizationId: string, projectId: string, id: string, status: ProjectTaskStatus): Promise<ProjectTask> {
    const result = await this.pool.query(
      `UPDATE project_tasks t SET status = $4, updated_at = NOW()
       FROM projects p
       WHERE t.project_id = p.id AND p.organization_id = $1 AND t.project_id = $2 AND t.id = $3
       RETURNING t.id, t.project_id, t.parent_task_id, t.title, t.description, t.status, t.assigned_to, t.sort_order`,
      [organizationId, projectId, id, status],
    );
    if (!result.rows[0]) throw new Error('Project task was not found.');
    return mapTask(result.rows[0]);
  }
}