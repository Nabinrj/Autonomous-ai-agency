import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../../common/auth/require-permission.js';
import { createWorkflowSchema, workflowIdSchema, workflowTransitionSchema } from './workflow.schema.js';
import { WorkflowService } from './workflow.service.js';

export async function registerWorkflowRoutes(app: FastifyInstance, service: WorkflowService): Promise<void> {
  app.post('/workflows', async (request, reply) => {
    const context = requirePermission(request, 'workflow.execute');
    const input = createWorkflowSchema.parse(request.body);
    const workflow = await service.create({ ...input, organizationId: context.organizationId });
    return reply.code(201).send({ data: workflow });
  });

  app.get('/workflows/:id', async (request) => {
    const context = requirePermission(request, 'workflow.read');
    const { id } = workflowIdSchema.parse(request.params);
    return { data: await service.get(context.organizationId, id) };
  });

  app.post('/workflows/:id/transition', async (request) => {
    const context = requirePermission(request, 'workflow.execute');
    const { id } = workflowIdSchema.parse(request.params);
    const input = workflowTransitionSchema.parse(request.body);
    return { data: await service.transition(context.organizationId, id, input.nextStatus, input.errorCode, input.errorMessage) };
  });
}