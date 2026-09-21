export type ProjectTaskStatus = 'TODO' | 'READY' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';

export interface ProjectTask {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  assignedTo: string | null;
  sortOrder: number;
}

export interface CreateProjectTaskInput {
  projectId: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  sortOrder?: number;
}

export interface ProjectTaskRepository {
  create(organizationId: string, input: CreateProjectTaskInput): Promise<ProjectTask>;
  findById(organizationId: string, projectId: string, id: string): Promise<ProjectTask | null>;
  list(organizationId: string, projectId: string): Promise<ProjectTask[]>;
  updateStatus(organizationId: string, projectId: string, id: string, status: ProjectTaskStatus): Promise<ProjectTask>;
}

export const PROJECT_TASK_TRANSITIONS: Record<ProjectTaskStatus, ProjectTaskStatus[]> = {
  TODO: ['READY', 'CANCELLED'],
  READY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['BLOCKED', 'DONE', 'CANCELLED'],
  BLOCKED: ['READY', 'IN_PROGRESS', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};