import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../../common/auth/require-permission.js';
import { createWorkflowStepSchema, workflowRunPathSchema, workflowStepPathSchema, workflowStepTransitionSchema } from './workflow-step.schema.js';
import { WorkflowService } from './workflow.service.js';
import { WorkflowStepService } from './workflow-step.service.js';

export async function registerWorkflowStepRoutes(app: FastifyInstance, steps: WorkflowStepService, workflows: WorkflowService): Promise<void> {
  app.post('/workflows/:workflowRunId/steps', async (request, reply) => {
    const context = requirePermission(request, 'workflow.execute');
    const { workflowRunId } = workflowRunPathSchema.parse(request.params);
    const input = createWorkflowStepSchema.parse(request.body);
    const workflow = await workflows.get(context.organizationId, workflowRunId);
    if (!['CREATED', 'RUNNING', 'WAITING'].includes(workflow.status)) {
      throw new Error('Cannot add a step to a terminal workflow.');
    }
    const step = await steps.create(context.organizationId, { ...input, workflowRunId }, workflow.correlationId);
    return reply.code(201).send({ data: step });
  });

  app.get('/workflows/:workflowRunId/steps', async (request) => {
    const context = requirePermission(request, 'workflow.read');
    const { workflowRunId } = workflowRunPathSchema.parse(request.params);
    await workflows.get(context.organizationId, workflowRunId);
    return { data: await steps.list(context.organizationId, workflowRunId) };
  });

  app.get('/workflows/:workflowRunId/steps/:id', async (request) => {
    const context = requirePermission(request, 'workflow.read');
    const { workflowRunId, id } = workflowStepPathSchema.parse(request.params);
    return { data: await steps.get(context.organizationId, workflowRunId, id) };
  });

  app.post('/workflows/:workflowRunId/steps/:id/transition', async (request) => {
    const context = requirePermission(request, 'workflow.execute');
    const { workflowRunId, id } = workflowStepPathSchema.parse(request.params);
    const input = workflowStepTransitionSchema.parse(request.body);
    const workflow = await workflows.get(context.organizationId, workflowRunId);
    return { data: await steps.transition(context.organizationId, workflowRunId, id, input.nextStatus, workflow.correlationId, {
      ...(input.outputReference === undefined ? {} : { outputReference: input.outputReference }),
      ...(input.errorCode === undefined ? {} : { errorCode: input.errorCode }),
      ...(input.errorMessage === undefined ? {} : { errorMessage: input.errorMessage }),
    }) };
  });
}
