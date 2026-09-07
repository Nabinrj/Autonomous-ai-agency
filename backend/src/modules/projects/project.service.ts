import { conflict, notFound } from '../../common/errors/app-error.js';
import { PROJECT_TRANSITIONS, type Project, type ProjectRepository, type ProjectStatus } from './project.types.js';

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  get(organizationId: string, id: string): Promise<Project> {
    return this.repository.findById(organizationId, id).then((project) => {
      if (!project) throw notFound('Project');
      return project;
    });
  }

  async transition(organizationId: string, id: string, next: ProjectStatus): Promise<Project> {
    const project = await this.get(organizationId, id);
    if (!PROJECT_TRANSITIONS[project.status].includes(next)) {
      throw conflict(`Invalid project transition: ${project.status} → ${next}`);
    }
    if (next === 'PLANNING' && !project.approvedRequirementVersionId) {
      throw conflict('Project requires an approved requirement version before planning.');
    }
    return this.repository.updateStatus(organizationId, id, next);
  }
}
