import type { FastifyInstance } from 'fastify';
import { getRequestContext, requirePermission } from '../../common/auth/require-permission.js';
import { approveRequirementSchema, requirementIdSchema } from './requirement.schema.js';
import { RequirementService } from './requirement.service.js';

export async function registerRequirementRoutes(app: FastifyInstance, service: RequirementService): Promise<void> {
  app.get('/requirements/:id', async (request) => {
    const context = requirePermission(request, 'requirements.read');
    const { id } = requirementIdSchema.parse(request.params);
    return { data: await service.get(context.organizationId, id) };
  });

  app.post('/requirements/:id/review', async (request) => {
    const context = requirePermission(request, 'requirements.write');
    const { id } = requirementIdSchema.parse(request.params);
    return { data: await service.moveToReview(context.organizationId, id) };
  });

  app.post('/requirements/:id/changes-requested', async (request) => {
    const context = requirePermission(request, 'requirements.write');
    const { id } = requirementIdSchema.parse(request.params);
    return { data: await service.requestChanges(context.organizationId, id) };
  });

  app.post('/requirements/:id/approve', async (request) => {
    const context = requirePermission(request, 'requirements.approve');
    const { id } = requirementIdSchema.parse(request.params);
    const { versionId } = approveRequirementSchema.parse(request.body);
    return { data: await service.approve(context.organizationId, id, versionId) };
  });
}
