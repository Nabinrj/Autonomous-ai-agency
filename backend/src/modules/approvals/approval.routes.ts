import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../../common/auth/require-permission.js';
import { approvalDecisionSchema, approvalIdSchema } from './approval.schema.js';
import { ApprovalService } from './approval.service.js';

export async function registerApprovalRoutes(app: FastifyInstance, service: ApprovalService): Promise<void> {
  app.get('/approvals/:id', async (request) => {
    const context = requirePermission(request, 'project.read');
    const { id } = approvalIdSchema.parse(request.params);
    return { data: await service.get(context.organizationId, id) };
  });

  app.post('/approvals/:id/decision', async (request) => {
    const context = requirePermission(request, 'project.approve');
    const { id } = approvalIdSchema.parse(request.params);
    const body = approvalDecisionSchema.parse(request.body);
    return { data: await service.decide(context.organizationId, id, context.userId, body.status, body.note) };
  });
}
