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

import type { Pool, PoolClient } from 'pg';
import { IdempotencyService } from '../src/modules/idempotency/idempotency.service.js';

type Stored = { request_hash: string; response_status: number | null; response_body: unknown };
class FakeClient {
  store = new Map<string, Stored>();
  snapshot: Map<string, Stored> | null = null;
  async query(sql: string, values: unknown[] = []): Promise<{ rows: unknown[] }> {
    if (sql === 'BEGIN') { this.snapshot = new Map(this.store); return { rows: [] }; }
    if (sql === 'COMMIT') { this.snapshot = null; return { rows: [] }; }
    if (sql === 'ROLLBACK') { if (this.snapshot) this.store = this.snapshot; this.snapshot = null; return { rows: [] }; }
    if (sql.includes('INSERT INTO idempotency_keys')) {
      const key = `${String(values[0])}:${String(values[1])}`;
      if (this.store.has(key)) return { rows: [] };
      this.store.set(key, { request_hash: String(values[2]), response_status: null, response_body: null });
      return { rows: [{ id: key }] };
    }
    if (sql.includes('UPDATE idempotency_keys')) {
      const key = `${String(values[0])}:${String(values[1])}`;
      const item = this.store.get(key);
      if (item) { item.response_status = Number(values[2]); item.response_body = JSON.parse(String(values[3])); }
      return { rows: [] };
    }
    if (sql.includes('SELECT request_hash')) {
      const key = `${String(values[0])}:${String(values[1])}`;
      const item = this.store.get(key);
      return { rows: item ? [{ ...item }] : [] };
    }
    throw new Error(`Unexpected SQL in idempotency test: ${sql}`);
  }
  release() {}
}
function createService() {
  const client = new FakeClient();
  const pool = { connect: async () => client } as unknown as Pool;
  return { service: new IdempotencyService(pool), client };
}

test('idempotency executes once and replays the stored response', async () => {
  const { service } = createService();
  let calls = 0;
  const operation = async () => { calls += 1; return { statusCode: 201, body: { id: 'customer-1' } }; };
  const first = await service.execute('org-1', 'request-key-0001', { name: 'A' }, operation);
  const replay = await service.execute('org-1', 'request-key-0001', { name: 'A' }, operation);
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.body, { id: 'customer-1' });
  assert.equal(calls, 1);
});

test('idempotency rejects reuse of a key with a different request', async () => {
  const { service } = createService();
  await service.execute('org-1', 'request-key-0002', { name: 'A' }, async () => ({ statusCode: 201, body: { ok: true } }));
  await assert.rejects(
    () => service.execute('org-1', 'request-key-0002', { name: 'B' }, async () => ({ statusCode: 201, body: { ok: true } })),
    /different request/,
  );
});

test('idempotency rolls back a failed operation so a retry can run', async () => {
  const { service, client } = createService();
  await assert.rejects(
    () => service.execute('org-1', 'request-key-0003', { name: 'A' }, async () => { throw new Error('database write failed'); }),
    /database write failed/,
  );
  assert.equal(client.store.size, 0);
  const result = await service.execute('org-1', 'request-key-0003', { name: 'A' }, async () => ({ statusCode: 201, body: { ok: true } }));
  assert.equal(result.replayed, false);
});

test('idempotency validates keys before opening a database connection', async () => {
  let connects = 0;
  const pool = { connect: async () => { connects += 1; throw new Error('must not connect'); } } as unknown as Pool;
  const service = new IdempotencyService(pool);
  await assert.rejects(() => service.execute('org-1', 'short', {}, async () => ({ statusCode: 200, body: {} })), /Idempotency-Key/);
  assert.equal(connects, 0);
});
