import { conflict, notFound, validationError } from '../../common/errors/app-error.js';
import type { AuditRepository } from '../audit/audit.types.js';
import type { CreateWorkflowStepInput, WorkflowStep, WorkflowStepRepository, WorkflowStepStatus } from './workflow-step.types.js';
import { WORKFLOW_STEP_TRANSITIONS } from './workflow-step.types.js';

const MAX_ATTEMPTS = 5;

export class WorkflowStepService {
  constructor(private readonly repository: WorkflowStepRepository, private readonly audit: AuditRepository) {}

  async create(organizationId: string, input: CreateWorkflowStepInput, correlationId: string): Promise<WorkflowStep> {
    if (!input.stepKey.trim()) throw validationError('A step key is required.');
    const step = await this.repository.create(organizationId, input);
    await this.audit.record({
      organizationId, actorType: 'SYSTEM', action: 'workflow_step.created',
      entityType: 'workflow_step', entityId: step.id, correlationId,
      metadata: { workflowRunId: step.workflowRunId, stepKey: step.stepKey },
    });
    return step;
  }

  async list(organizationId: string, workflowRunId: string): Promise<WorkflowStep[]> {
    return this.repository.list(organizationId, workflowRunId);
  }

  async get(organizationId: string, workflowRunId: string, id: string): Promise<WorkflowStep> {
    const step = await this.repository.findById(organizationId, workflowRunId, id);
    if (!step) throw notFound('Workflow step');
    return step;
  }

  async transition(
    organizationId: string,
    workflowRunId: string,
    id: string,
    next: WorkflowStepStatus,
    correlationId: string,
    result?: { outputReference?: string; errorCode?: string; errorMessage?: string },
  ): Promise<WorkflowStep> {
    const step = await this.get(organizationId, workflowRunId, id);
    if (!WORKFLOW_STEP_TRANSITIONS[step.status].includes(next)) {
      throw conflict('Invalid workflow step transition: ' + step.status + ' -> ' + next);
    }
    if (next === 'RUNNING' && step.attempt >= MAX_ATTEMPTS) {
      throw conflict('Workflow step retry limit has been reached.');
    }
    if (next === 'FAILED' && !result?.errorCode) throw validationError('A failed step requires an error code.');
    if (next === 'COMPLETED' && result?.errorMessage) throw validationError('A completed step cannot include an error message.');
    const updated = await this.repository.transition(organizationId, workflowRunId, id, step.status, next, result);
    await this.audit.record({
      organizationId, actorType: 'SYSTEM', action: 'workflow_step.' + next.toLowerCase(),
      entityType: 'workflow_step', entityId: id, correlationId,
      metadata: { workflowRunId, stepKey: step.stepKey, previousStatus: step.status, nextStatus: next, attempt: updated.attempt },
    });
    return updated;
  }
}
