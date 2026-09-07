import { conflict, notFound, validationError } from '../../common/errors/app-error.js';
import { REQUIREMENT_TRANSITIONS, type RequirementRepository, type RequirementStatus } from './requirement.types.js';

export class RequirementService {
  constructor(private readonly repository: RequirementRepository) {}

  async moveToReview(organizationId: string, id: string) {
    return this.transition(organizationId, id, 'READY_FOR_REVIEW');
  }

  async requestChanges(organizationId: string, id: string) {
    return this.transition(organizationId, id, 'CHANGES_REQUESTED');
  }

  async approve(organizationId: string, id: string, versionId: string) {
    if (!versionId) throw validationError('An approved requirement version is required.');
    const requirement = await this.repository.findById(organizationId, id);
    if (!requirement) throw notFound('Requirement');
    if (!REQUIREMENT_TRANSITIONS[requirement.status].includes('APPROVED')) {
      throw conflict(`Requirement cannot be approved from status ${requirement.status}.`);
    }
    const version = await this.repository.getVersion(organizationId, id, versionId);
    if (!version) throw notFound('Requirement version');
    return this.repository.updateStatus(organizationId, id, 'APPROVED', version.id);
  }

  private async transition(organizationId: string, id: string, next: RequirementStatus) {
    const requirement = await this.repository.findById(organizationId, id);
    if (!requirement) throw notFound('Requirement');
    if (!REQUIREMENT_TRANSITIONS[requirement.status].includes(next)) {
      throw conflict(`Invalid requirement transition: ${requirement.status} → ${next}`);
    }
    return this.repository.updateStatus(organizationId, id, next);
  }
}
