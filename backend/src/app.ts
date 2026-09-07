import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { getDatabasePool } from './infrastructure/database/pool.js';
import { DevelopmentAuthenticationProvider } from './modules/auth/dev-auth.js';
import { toRequestContext } from './modules/auth/auth.types.js';
import { PostgresCustomerRepository } from './modules/customers/customer.repository.js';
import { CustomerService } from './modules/customers/customer.service.js';
import { registerCustomerRoutes } from './modules/customers/customer.routes.js';
import { PostgresLeadRepository } from './modules/leads/lead.repository.js';
import { LeadService } from './modules/leads/lead.service.js';
import { registerLeadRoutes } from './modules/leads/lead.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
    requestIdHeader: 'x-request-id',
  });

  app.register(helmet);
  app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  const authProvider = env.NODE_ENV === 'development'
    ? new DevelopmentAuthenticationProvider()
    : null;

  app.addHook('onRequest', async (request) => {
    if (!authProvider) return;
    const principal = await authProvider.authenticate(request.headers as Record<string, string | undefined>);
    if (principal) {
      request.requestContext = toRequestContext(principal, request.id, request.id);
    }
  });

  app.get('/health', async (_request, reply) => reply.code(200).send({
    data: { status: 'ok', service: 'autonomous-ai-agency-backend' },
  }));

  app.get('/ready', async (_request, reply) => {
    try {
      await getDatabasePool().query('SELECT 1');
      return reply.code(200).send({
        data: { status: 'ready', dependencies: { database: 'ok', queue: 'not_configured' } },
      });
    } catch {
      return reply.code(503).send({
        error: { code: 'NOT_READY', message: 'Database dependency is unavailable.' },
      });
    }
  });

  app.get('/api/v1', async () => ({
    data: { name: 'Autonomous AI Agency API', version: 'v1' },
  }));

  const pool = getDatabasePool();
  const customerService = new CustomerService(new PostgresCustomerRepository(pool));
  const leadService = new LeadService(new PostgresLeadRepository(pool));

  app.register(async (scope) => registerCustomerRoutes(scope, customerService), { prefix: '/api/v1' });
  app.register(async (scope) => registerLeadRoutes(scope, leadService), { prefix: '/api/v1' });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    const appError = error as { code?: string; details?: unknown };
    return reply.code(statusCode).send({
      error: {
        code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : (appError.code ?? 'REQUEST_ERROR'),
        message: statusCode === 500 ? 'An unexpected error occurred.' : error.message,
        requestId: request.id,
        ...(appError.details === undefined ? {} : { details: appError.details }),
      },
    });
  });

  return app;
}
