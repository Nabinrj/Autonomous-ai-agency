import { conflict, notFound, validationError } from '../../common/errors/app-error.js';
import type { AuditRepository } from '../audit/audit.types.js';
import type { CreateWorkflowRunInput, WorkflowRepository, WorkflowRun, WorkflowStatus } from './workflow.types.js';
import { WORKFLOW_TRANSITIONS } from './workflow.types.js';

export class WorkflowService {
  constructor(private readonly repository: WorkflowRepository, private readonly audit: AuditRepository) {}

  async create(input: CreateWorkflowRunInput): Promise<WorkflowRun> {
    if (!input.correlationId) throw validationError('A workflow correlation ID is required.');
    const workflow = await this.repository.create(input);
    await this.audit.record({
      organizationId: input.organizationId,
      actorType: 'SYSTEM',
      action: 'workflow.created',
      entityType: 'workflow_run',
      entityId: workflow.id,
      correlationId: workflow.correlationId,
      metadata: { workflowType: workflow.workflowType },
    });
    return workflow;
  }

  async get(organizationId: string, id: string): Promise<WorkflowRun> {
    const workflow = await this.repository.findById(organizationId, id);
    if (!workflow) throw notFound('Workflow run');
    return workflow;
  }

  async transition(organizationId: string, id: string, next: WorkflowStatus, errorCode?: string, errorMessage?: string): Promise<WorkflowRun> {
    const workflow = await this.get(organizationId, id);
    if (!WORKFLOW_TRANSITIONS[workflow.status].includes(next)) {
      throw conflict(`Invalid workflow transition: ${workflow.status} → ${next}`);
    }
    const updated = await this.repository.updateStatus(organizationId, id, next, errorCode, errorMessage);
    await this.audit.record({
      organizationId,
      actorType: 'SYSTEM',
      action: `workflow.${next.toLowerCase()}`,
      entityType: 'workflow_run',
      entityId: id,
      correlationId: updated.correlationId,
      metadata: { previousStatus: workflow.status, nextStatus: next },
    });
    return updated;
  }
}