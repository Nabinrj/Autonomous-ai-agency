import type { FastifyInstance } from 'fastify';
import { requirePermission } from '../../common/auth/require-permission.js';
import { createProjectTaskSchema, projectTaskIdSchema, projectTaskProjectIdSchema, projectTaskTransitionSchema } from './project-task.schema.js';
import { ProjectTaskService } from './project-task.service.js';

export async function registerProjectTaskRoutes(app: FastifyInstance, service: ProjectTaskService): Promise<void> {
  app.post('/projects/:projectId/tasks', async (request, reply) => {
    const context = requirePermission(request, 'project.write');
    const params = projectTaskProjectIdSchema.parse(request.params);
    const input = createProjectTaskSchema.parse(request.body);
    if (input.projectId !== params.projectId) throw new Error('Path projectId must match body projectId.');
    const task = await service.create(context.organizationId, input);
    return reply.code(201).send({ data: task });
  });

  app.get('/projects/:projectId/tasks', async (request) => {
    const context = requirePermission(request, 'project.read');
    const { projectId } = projectTaskProjectIdSchema.parse(request.params);
    return { data: await service.list(context.organizationId, projectId) };
  });

  app.get('/projects/:projectId/tasks/:id', async (request) => {
    const context = requirePermission(request, 'project.read');
    const { projectId } = projectTaskProjectIdSchema.parse(request.params);
    const { id } = projectTaskIdSchema.parse(request.params);
    return { data: await service.get(context.organizationId, projectId, id) };
  });

  app.post('/projects/:projectId/tasks/:id/transition', async (request) => {
    const context = requirePermission(request, 'project.write');
    const { projectId } = projectTaskProjectIdSchema.parse(request.params);
    const { id } = projectTaskIdSchema.parse(request.params);
    const { nextStatus } = projectTaskTransitionSchema.parse(request.body);
    return { data: await service.transition(context.organizationId, projectId, id, nextStatus) };
  });
}