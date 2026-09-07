import { conflict, notFound } from '../../common/errors/app-error.js';
import { PROJECT_TRANSITIONS, type ProjectRepository, type ProjectStatus } from './project.types.js';

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  async transition(organizationId: string, id: string, next: ProjectStatus) {
    const project = await this.repository.findById(organizationId, id);
    if (!project) throw notFound('Project');

    if (!PROJECT_TRANSITIONS[project.status].includes(next)) {
      throw conflict(`Invalid project transition: ${project.status} → ${next}`);
    }

    if (next === 'PLANNING' && !project.approvedRequirementVersionId) {
      throw conflict('Project requires an approved requirement version before planning.');
    }

    return this.repository.updateStatus(organizationId, id, next);
  }
}
