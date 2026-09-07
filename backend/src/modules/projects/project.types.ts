export type ProjectStatus = 'DRAFT' | 'REQUIREMENTS_READY' | 'PROPOSED' | 'APPROVED' | 'PLANNING' | 'IN_PROGRESS' | 'QA' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface Project {
  id: string;
  organizationId: string;
  customerId: string;
  requirementId: string;
  approvedRequirementVersionId: string | null;
  name: string;
  status: ProjectStatus;
}

export interface ProjectRepository {
  findById(organizationId: string, id: string): Promise<Project | null>;
  updateStatus(organizationId: string, id: string, status: ProjectStatus): Promise<Project>;
}

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['REQUIREMENTS_READY', 'CANCELLED'],
  REQUIREMENTS_READY: ['PROPOSED', 'CANCELLED'],
  PROPOSED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PLANNING', 'CANCELLED'],
  PLANNING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['QA', 'CANCELLED'],
  QA: ['READY_FOR_DELIVERY', 'IN_PROGRESS', 'CANCELLED'],
  READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};
