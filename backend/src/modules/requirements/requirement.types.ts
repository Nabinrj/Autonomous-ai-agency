export type RequirementStatus = 'DRAFT' | 'READY_FOR_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'ARCHIVED';

export interface Requirement {
  id: string;
  organizationId: string;
  customerId: string;
  status: RequirementStatus;
  approvedVersionId: string | null;
}

export interface RequirementVersion {
  id: string;
  requirementId: string;
  versionNumber: number;
  content: Record<string, unknown>;
  completenessScore: number | null;
}

export interface RequirementRepository {
  findById(organizationId: string, id: string): Promise<Requirement | null>;
  getVersion(organizationId: string, requirementId: string, versionId: string): Promise<RequirementVersion | null>;
  updateStatus(organizationId: string, id: string, status: RequirementStatus, approvedVersionId?: string): Promise<Requirement>;
}

export const REQUIREMENT_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]> = {
  DRAFT: ['READY_FOR_REVIEW', 'ARCHIVED'],
  READY_FOR_REVIEW: ['CHANGES_REQUESTED', 'APPROVED'],
  CHANGES_REQUESTED: ['READY_FOR_REVIEW', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: [],
};
