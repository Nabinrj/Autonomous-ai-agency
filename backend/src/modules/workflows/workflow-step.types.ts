export type WorkflowStepStatus = 'PENDING' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';

export interface WorkflowStep {
  id: string;
  workflowRunId: string;
  stepKey: string;
  status: WorkflowStepStatus;
  attempt: number;
  inputReference: string | null;
  outputReference: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface CreateWorkflowStepInput {
  workflowRunId: string;
  stepKey: string;
  inputReference?: string;
}

export interface WorkflowStepRepository {
  create(organizationId: string, input: CreateWorkflowStepInput): Promise<WorkflowStep>;
  findById(organizationId: string, workflowRunId: string, id: string): Promise<WorkflowStep | null>;
  list(organizationId: string, workflowRunId: string): Promise<WorkflowStep[]>;
  transition(organizationId: string, workflowRunId: string, id: string, expectedStatus: WorkflowStepStatus, nextStatus: WorkflowStepStatus, result?: { outputReference?: string; errorCode?: string; errorMessage?: string }): Promise<WorkflowStep>;
}

export const WORKFLOW_STEP_TRANSITIONS: Record<WorkflowStepStatus, WorkflowStepStatus[]> = {
  PENDING: ['RUNNING', 'SKIPPED', 'CANCELLED'],
  RUNNING: ['WAITING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  WAITING: ['RUNNING', 'CANCELLED'],
  COMPLETED: [],
  FAILED: ['PENDING', 'CANCELLED'],
  SKIPPED: [],
  CANCELLED: [],
};
