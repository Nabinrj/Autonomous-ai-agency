import type { FastifyInstance } from 'fastify';
import { createCustomerSchema, customerIdSchema, listCustomersQuerySchema } from './customer.schema.js';
import { CustomerService } from './customer.service.js';
import { requirePermission } from '../auth/authorization.js';
import { validationError } from '../../common/errors/app-error.js';
import { IdempotencyService } from '../idempotency/idempotency.service.js';
import type { RequestContext } from '../../common/types/request-context.js';

export async function registerCustomerRoutes(app: FastifyInstance, service: CustomerService, idempotency: IdempotencyService): Promise<void> {
  app.post('/customers', async (request, reply) => {
    const context = request.requestContext as RequestContext;
    requirePermission(context, 'customer.write');
    const input = createCustomerSchema.parse(request.body);
    const keyHeader = request.headers['idempotency-key'];
    if (typeof keyHeader !== 'string') throw validationError('Idempotency-Key header is required.');
    const createInput = {
      organizationId: context.organizationId,
      name: input.name,
      ...(input.notes === undefined ? {} : { notes: input.notes }),
    };
    const result = await idempotency.execute(
      context.organizationId,
      keyHeader,
      { operation: 'customers.create', input: { name: input.name, notes: input.notes ?? null } },
      async (transaction) => {
        const customer = await service.create(createInput, transaction);
        return {
          statusCode: 201,
          body: {
            data: {
              id: customer.id,
              organizationId: customer.organizationId,
              name: customer.name,
              status: customer.status,
              notes: customer.notes,
              createdAt: customer.createdAt,
              updatedAt: customer.updatedAt,
            },
          },
        };
      },
    );
    return reply
      .code(result.statusCode)
      .header('Idempotency-Replayed', result.replayed ? 'true' : 'false')
      .send(result.body);
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
