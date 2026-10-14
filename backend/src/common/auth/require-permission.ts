import type { FastifyRequest } from 'fastify';
import { requirePermission as authorize } from '../../modules/auth/authorization.js';
import type { RequestContext } from '../types/request-context.js';

/** Return the authenticated principal or fail closed with 401. */
export function getRequestContext(request: FastifyRequest): RequestContext {
  const context = request.requestContext as RequestContext | undefined;
  // The shared guard owns the canonical missing-principal behavior.
  authorize(context, '__authenticated__');
  return context as RequestContext;
}

/** Enforce permission checks consistently for Fastify route handlers. */
export function requirePermission(request: FastifyRequest, permission: string): RequestContext {
  const context = getRequestContext(request);
  authorize(context, permission);
  return context;
}
