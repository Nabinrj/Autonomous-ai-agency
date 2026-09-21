export type WorkflowStatus = 'CREATED' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';

export interface WorkflowRun {
  id: string;
  organizationId: string;
  workflowType: string;
  entityType: string | null;
  entityId: string | null;
  status: WorkflowStatus;
  correlationId: string;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface CreateWorkflowRunInput {
  organizationId: string;
  workflowType: string;
  entityType?: string;
  entityId?: string;
  correlationId: string;
}

export interface WorkflowRepository {
  create(input: CreateWorkflowRunInput): Promise<WorkflowRun>;
  findById(organizationId: string, id: string): Promise<WorkflowRun | null>;
  updateStatus(organizationId: string, id: string, status: WorkflowStatus, errorCode?: string, errorMessage?: string): Promise<WorkflowRun>;
}

export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  CREATED: ['RUNNING', 'CANCELLED', 'TIMED_OUT'],
  RUNNING: ['WAITING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT'],
  WAITING: ['RUNNING', 'CANCELLED', 'TIMED_OUT'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
  TIMED_OUT: [],
};