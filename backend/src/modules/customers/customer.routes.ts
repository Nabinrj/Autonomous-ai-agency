import type { FastifyInstance } from 'fastify';
import { createCustomerSchema, customerIdSchema, listCustomersQuerySchema } from './customer.schema.js';
import { CustomerService } from './customer.service.js';
import { requirePermission } from '../auth/authorization.js';
import type { RequestContext } from '../../common/types/request-context.js';

export async function registerCustomerRoutes(app: FastifyInstance, service: CustomerService): Promise<void> {
  app.post('/customers', async (request, reply) => {
    const context = request.requestContext as RequestContext;
    requirePermission(context, 'customer.write');
    const input = createCustomerSchema.parse(request.body);
    const customer = await service.create({ ...input, organizationId: context.organizationId });
    return reply.code(201).send({ data: customer });
  });

  app.get('/customers', async (request) => {
    const context = request.requestContext as RequestContext;
    requirePermission(context, 'customer.read');
    const query = listCustomersQuerySchema.parse(request.query);
    const customers = await service.list(context.organizationId, query.limit, query.offset);
    return { data: customers, meta: { limit: query.limit, offset: query.offset } };
  });

  app.get('/customers/:id', async (request) => {
    const context = request.requestContext as RequestContext;
    requirePermission(context, 'customer.read');
    const params = customerIdSchema.parse(request.params);
    const customer = await service.get(context.organizationId, params.id);
    return { data: customer };
  });
}
