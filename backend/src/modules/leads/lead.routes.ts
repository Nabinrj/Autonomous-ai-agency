import type { FastifyInstance } from 'fastify';
import type { RequestContext } from '../../common/types/request-context.js';
import { convertLeadSchema, createLeadSchema, leadIdSchema, qualifyLeadSchema } from './lead.schema.js';
import { LeadService } from './lead.service.js';

export async function registerLeadRoutes(app: FastifyInstance, service: LeadService): Promise<void> {
  app.post('/leads', async (request, reply) => {
    const context = request.requestContext as RequestContext;
    const input = createLeadSchema.parse(request.body);
    const lead = await service.create({ ...input, organizationId: context.organizationId });
    return reply.code(201).send({ data: lead });
  });

  app.get('/leads/:id', async (request) => {
    const context = request.requestContext as RequestContext;
    const { id } = leadIdSchema.parse(request.params);
    const lead = await service.get(context.organizationId, id);
    return { data: lead };
  });

  app.post('/leads/:id/qualify', async (request) => {
    const context = request.requestContext as RequestContext;
    const { id } = leadIdSchema.parse(request.params);
    const input = qualifyLeadSchema.parse(request.body);
    return { data: await service.qualify(context.organizationId, id, input.score, input.qualified, input.reason) };
  });

  app.post('/leads/:id/convert', async (request) => {
    const context = request.requestContext as RequestContext;
    const { id } = leadIdSchema.parse(request.params);
    const { customerId } = convertLeadSchema.parse(request.body);
    return { data: await service.convert(context.organizationId, id, customerId) };
  });
}
