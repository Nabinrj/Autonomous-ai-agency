import test from 'node:test';
import assert from 'node:assert/strict';
import { requirePermission, assertOrganization } from '../src/modules/auth/authorization.js';
import type { RequestContext } from '../src/common/types/request-context.js';

const context: RequestContext = {
  requestId: 'request-1', correlationId: 'correlation-1', userId: 'user-1', organizationId: 'org-1',
  roles: ['OPERATOR'], permissions: ['lead.read'],
};

test('authorization rejects missing identity', () => {
  assert.throws(() => requirePermission(undefined, 'lead.read'), (error: unknown) => typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 401);
});

test('authorization rejects missing permission', () => {
  assert.throws(() => requirePermission(context, 'project.write'), (error: unknown) => typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 403);
});

test('authorization returns for explicitly granted permission', () => {
  assert.doesNotThrow(() => requirePermission(context, 'lead.read'));
});

test('organization boundary rejects cross-tenant access', () => {
  assert.throws(() => assertOrganization(context, 'org-2'), (error: unknown) => typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 403);
});

test('OWNER role does not bypass an ungranted permission', () => {
  const owner: RequestContext = { ...context, roles: ['OWNER'], permissions: ['lead.read'] };
  assert.throws(() => requirePermission(owner, 'project.delete'), (error: unknown) => typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 403);
});
