import type { FastifyRequest } from 'fastify';
import { forbidden, unauthorized } from '../errors/app-error.js';
import type { RequestContext } from '../types/request-context.js';

export function getRequestContext(request: FastifyRequest): RequestContext {
  if (!request.requestContext) throw unauthorized('Authentication is required.');
  return request.requestContext;
}

export function requirePermission(request: FastifyRequest, permission: string): RequestContext {
  const context = getRequestContext(request);
  if (!context.permissions.includes(permission)) {
    throw forbidden('You do not have permission to perform this action.');
  }
  return context;
}
