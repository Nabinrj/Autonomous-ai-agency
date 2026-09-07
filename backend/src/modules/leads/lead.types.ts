export type LeadStatus = 'NEW' | 'QUALIFYING' | 'QUALIFIED' | 'DISQUALIFIED' | 'CONVERTED';

export interface Lead {
  id: string;
  organizationId: string;
  customerId: string | null;
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  score: number | null;
  qualificationReason: string | null;
}

export interface CreateLeadInput {
  organizationId: string;
  source: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface LeadRepository {
  create(input: CreateLeadInput): Promise<Lead>;
  findById(organizationId: string, id: string): Promise<Lead | null>;
  updateStatus(organizationId: string, id: string, status: LeadStatus, score?: number, reason?: string): Promise<Lead>;
  convert(organizationId: string, id: string, customerId: string): Promise<Lead>;
}

export const LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['QUALIFYING', 'DISQUALIFIED'],
  QUALIFYING: ['QUALIFIED', 'DISQUALIFIED'],
  QUALIFIED: ['CONVERTED', 'DISQUALIFIED'],
  DISQUALIFIED: [],
  CONVERTED: [],
};
