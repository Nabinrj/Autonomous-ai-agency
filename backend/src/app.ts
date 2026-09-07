import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    },
    requestIdHeader: 'x-request-id'
  });

  app.register(helmet);
  app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true
  });
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  app.get('/health', async (_request, reply) => {
    return reply.code(200).send({
      data: {
        status: 'ok',
        service: 'autonomous-ai-agency-backend'
      }
    });
  });

  app.get('/ready', async (_request, reply) => {
    // Dependency checks will be added when database/queue adapters are connected.
    return reply.code(200).send({
      data: {
        status: 'ready',
        dependencies: {
          database: 'not_configured',
          queue: 'not_configured'
        }
      }
    });
  });

  app.get('/api/v1', async () => ({
    data: {
      name: 'Autonomous AI Agency API',
      version: 'v1'
    }
  }));

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode && error.statusCode >= 400
      ? error.statusCode
      : 500;

    return reply.code(statusCode).send({
      error: {
        code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
        message: statusCode === 500 ? 'An unexpected error occurred.' : error.message
      },
      meta: {
        request_id: request.id
      }
    });
  });

  return app;
}
