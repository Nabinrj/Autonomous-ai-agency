import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../../common/auth/require-permission.js';
import { projectIdSchema, projectTransitionSchema } from './project.schema.js';
import type { ProjectStatus } from './project.types.js';
import { ProjectService } from './project.service.js';

export async function registerProjectRoutes(app: FastifyInstance, service: ProjectService): Promise<void> {
  app.get('/projects/:id', async (request) => {
    const context = requirePermission(request, 'project.read');
    const { id } = projectIdSchema.parse(request.params);
    return { data: await service.get(context.organizationId, id) };
  });

  app.post('/projects/:id/transition', async (request) => {
    const context = requirePermission(request, 'project.write');
    const { id } = projectIdSchema.parse(request.params);
    const { nextStatus } = projectTransitionSchema.parse(request.body);
    return { data: await service.transition(context.organizationId, id, nextStatus as ProjectStatus) };
  });
}
