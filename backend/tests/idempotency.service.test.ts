import test from 'node:test';
import assert from 'node:assert/strict';
import { hashIdempotencyRequest } from '../src/modules/idempotency/idempotency.service.js';

test('idempotency request hash is independent of object key order', () => {
  assert.equal(
    hashIdempotencyRequest({ customer: { name: 'A', email: 'a@example.test' }, enabled: true }),
    hashIdempotencyRequest({ enabled: true, customer: { email: 'a@example.test', name: 'A' } }),
  );
});

test('idempotency request hash distinguishes different payloads', () => {
  assert.notEqual(
    hashIdempotencyRequest({ customerId: 'customer-a' }),
    hashIdempotencyRequest({ customerId: 'customer-b' }),
  );
});

test('idempotency request hash preserves array order', () => {
  assert.notEqual(
    hashIdempotencyRequest({ steps: ['requirements', 'proposal'] }),
    hashIdempotencyRequest({ steps: ['proposal', 'requirements'] }),
  );
});
