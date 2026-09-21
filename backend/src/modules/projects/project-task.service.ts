import { conflict, notFound, validationError } from '../../common/errors/app-error.js';
import type { CreateProjectTaskInput, ProjectTask, ProjectTaskRepository, ProjectTaskStatus } from './project-task.types.js';
import { PROJECT_TASK_TRANSITIONS } from './project-task.types.js';

export class ProjectTaskService {
  constructor(private readonly repository: ProjectTaskRepository) {}

  async create(organizationId: string, input: CreateProjectTaskInput): Promise<ProjectTask> {
    if (!input.title.trim()) throw validationError('Task title is required.');
    return this.repository.create(organizationId, input);
  }

  list(organizationId: string, projectId: string): Promise<ProjectTask[]> {
    return this.repository.list(organizationId, projectId);
  }

  async get(organizationId: string, projectId: string, id: string): Promise<ProjectTask> {
    const task = await this.repository.findById(organizationId, projectId, id);
    if (!task) throw notFound('Project task');
    return task;
  }

  async transition(organizationId: string, projectId: string, id: string, next: ProjectTaskStatus): Promise<ProjectTask> {
    const task = await this.get(organizationId, projectId, id);
    if (!PROJECT_TASK_TRANSITIONS[task.status].includes(next)) {
      throw conflict(`Invalid task transition: ${task.status} → ${next}`);
    }
    return this.repository.updateStatus(organizationId, projectId, id, next);
  }
}