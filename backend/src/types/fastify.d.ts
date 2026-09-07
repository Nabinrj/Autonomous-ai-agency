import type { RequestContext } from '../common/types/request-context.js';

declare module 'fastify' {
  interface FastifyRequest {
    requestContext?: RequestContext;
  }
}
