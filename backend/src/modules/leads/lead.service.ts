import { conflict, notFound, validationError } from '../../common/errors/app-error.js';
import { LEAD_TRANSITIONS, type CreateLeadInput, type Lead, type LeadRepository, type LeadStatus } from './lead.types.js';

export class LeadService {
  constructor(private readonly repository: LeadRepository) {}

  create(input: CreateLeadInput): Promise<Lead> {
    if (!input.email && !input.phone && !input.name) {
      throw validationError('A lead requires at least a name, email, or phone.');
    }
    return this.repository.create(input);
  }

  async get(organizationId: string, id: string): Promise<Lead> {
    const lead = await this.repository.findById(organizationId, id);
    if (!lead) throw notFound('Lead');
    return lead;
  }

  async qualify(organizationId: string, id: string, score: number, qualified: boolean, reason: string): Promise<Lead> {
    if (score < 0 || score > 100) throw validationError('Lead score must be between 0 and 100.');
    const lead = await this.get(organizationId, id);
    const next: LeadStatus = qualified ? 'QUALIFIED' : 'DISQUALIFIED';
    if (!LEAD_TRANSITIONS[lead.status].includes(next)) {
      throw conflict(`Invalid lead transition: ${lead.status} → ${next}`);
    }
    return this.repository.updateStatus(organizationId, id, next, score, reason);
  }

  async convert(organizationId: string, id: string, customerId: string): Promise<Lead> {
    const lead = await this.get(organizationId, id);
    if (!LEAD_TRANSITIONS[lead.status].includes('CONVERTED')) {
      throw conflict(`Lead cannot be converted from status ${lead.status}.`);
    }
    return this.repository.convert(organizationId, id, customerId);
  }
}
