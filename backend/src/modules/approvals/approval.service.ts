import { conflict, notFound } from '../../common/errors/app-error.js';
import type { Approval, ApprovalRepository } from './approval.types.js';

export class ApprovalService {
  constructor(private readonly repository: ApprovalRepository) {}

  get(organizationId: string, id: string): Promise<Approval> {
    return this.repository.findById(organizationId, id).then((approval) => {
      if (!approval) throw notFound('Approval');
      return approval;
    });
  }

  async decide(organizationId: string, id: string, decidedBy: string, status: 'APPROVED' | 'REJECTED', note?: string): Promise<Approval> {
    const approval = await this.get(organizationId, id);
    if (approval.status !== 'PENDING') throw conflict(`Approval is already ${approval.status}.`);
    if (approval.requestedBy === decidedBy) throw conflict('The requester cannot decide their own approval.');
    return this.repository.decide(organizationId, id, status, decidedBy, note);
  }
}
