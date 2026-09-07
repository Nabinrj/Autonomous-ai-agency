import test from 'node:test';
import assert from 'node:assert/strict';
import { LeadService } from '../src/modules/leads/lead.service.js';
import type { CreateLeadInput, Lead, LeadRepository, LeadStatus } from '../src/modules/leads/lead.types.js';

class MemoryLeadRepository implements LeadRepository {
  private readonly leads = new Map<string, Lead>();

  async create(input: CreateLeadInput): Promise<Lead> {
    const lead: Lead = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      customerId: null,
      source: input.source,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      status: 'NEW', score: null, qualificationReason: null,
    };
    this.leads.set(lead.id, lead);
    return lead;
  }

  async findById(_organizationId: string, id: string) {
    return this.leads.get(id) ?? null;
  }

  async updateStatus(_organizationId: string, id: string, status: LeadStatus, score?: number, reason?: string) {
    const lead = this.leads.get(id)!;
    const updated = { ...lead, status, score: score ?? lead.score, qualificationReason: reason ?? lead.qualificationReason };
    this.leads.set(id, updated);
    return updated;
  }

  async convert(_organizationId: string, id: string, customerId: string) {
    const lead = this.leads.get(id)!;
    const updated = { ...lead, customerId, status: 'CONVERTED' as const };
    this.leads.set(id, updated);
    return updated;
  }
}

test('lead lifecycle enforces qualification before conversion', async () => {
  const service = new LeadService(new MemoryLeadRepository());
  const lead = await service.create({ organizationId: 'org-1', source: 'website', email: 'lead@example.com' });

  await assert.rejects(() => service.convert('org-1', lead.id, 'customer-1'), /cannot be converted/);

  const qualified = await service.qualify('org-1', lead.id, 85, true, 'Clear project fit');
  assert.equal(qualified.status, 'QUALIFIED');

  const converted = await service.convert('org-1', lead.id, 'customer-1');
  assert.equal(converted.status, 'CONVERTED');
  assert.equal(converted.customerId, 'customer-1');
});
