export type ApprovalType = 'MARKETING_PUBLICATION' | 'PROPOSAL' | 'REQUIREMENT_CHANGE' | 'PRODUCTION_DEPLOYMENT' | 'FINAL_DELIVERY' | 'DESTRUCTIVE_ACTION';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface Approval {
  id: string;
  organizationId: string;
  projectId: string | null;
  requirementId: string | null;
  approvalType: ApprovalType;
  status: ApprovalStatus;
  requestedBy: string;
  decidedBy: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
}

export interface ApprovalRepository {
  findById(organizationId: string, id: string): Promise<Approval | null>;
  decide(organizationId: string, id: string, status: 'APPROVED' | 'REJECTED', decidedBy: string, note?: string): Promise<Approval>;
}
